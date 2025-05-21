// main.rs
use deno_core::error::CoreError;
use deno_core::error::ModuleLoaderError;
use deno_core::{FastString, ModuleLoader, ModuleSource, ModuleType, RequestedModuleType};
use deno_core::{ModuleLoadResponse, ModuleSourceCode, ModuleSpecifier, ResolutionKind};
use deno_error::JsErrorBox;
use std::env;
use std::io;
use std::rc::Rc;

pub mod bindings;
use bindings::ejsr_extensions;

// 自定义模块加载器，用于处理内部模块和文件系统模块
#[derive(Debug)]
struct EJSRModuleLoader;

impl ModuleLoader for EJSRModuleLoader {
    fn resolve(
        &self,
        specifier: &str,
        referrer: &str,
        _kind: ResolutionKind,
    ) -> Result<ModuleSpecifier, ModuleLoaderError> {
        // 处理内部模块
        if specifier.starts_with("./modules/") && referrer.starts_with("ejsr:runtime/") {
            let internal_path = format!("ejsr:runtime{}", &specifier[1..]);
            return ModuleSpecifier::parse(&internal_path).map_err(|e| {
                ModuleLoaderError::from(io::Error::new(io::ErrorKind::InvalidInput, e.to_string()))
            });
        }

        // 常规模块解析
        deno_core::resolve_import(specifier, referrer).map_err(|e| {
            ModuleLoaderError::from(io::Error::new(io::ErrorKind::InvalidInput, e.to_string()))
        })
    }

    fn load(
        &self,
        module_specifier: &ModuleSpecifier,
        _maybe_referrer: Option<&ModuleSpecifier>,
        _is_dyn_import: bool,
        _requested_module_type: RequestedModuleType,
    ) -> ModuleLoadResponse {
        let module_specifier = module_specifier.clone();

        // 创建一个闭包并立即调用它，返回 Result<ModuleSource, ModuleLoaderError>
        ModuleLoadResponse::Sync((move || -> Result<ModuleSource, ModuleLoaderError> {
            let path = module_specifier.to_string();

            // 处理内部运行时模块
            if path.starts_with("ejsr:runtime/") {
                let rel_path = path.strip_prefix("ejsr:runtime/").unwrap();

                // 根据路径确定文件内容
                let source_code = match rel_path {
                    "index.js" => include_str!("runtime/index.js"),
                    "modules/console.js" => include_str!("runtime/modules/console.js"),
                    "modules/fetch.js" => include_str!("runtime/modules/fetch.js"),
                    "modules/fs.js" => include_str!("runtime/modules/fs.js"),
                    "modules/timer.js" => include_str!("runtime/modules/timer.js"),
                    "modules/crypto.js" => include_str!("runtime/modules/crypto.js"),
                    _ => {
                        return Err(ModuleLoaderError::from(io::Error::new(
                            io::ErrorKind::NotFound,
                            format!("内部模块 '{}' 不存在", rel_path),
                        )))
                    }
                };

                // 创建 ModuleSource - 将 &str 先转为 String，再转为 FastString
                let code_string = source_code.to_string();
                let module = ModuleSource::new(
                    ModuleType::JavaScript,
                    ModuleSourceCode::String(FastString::from(code_string)),
                    &module_specifier,
                    None,
                );

                Ok(module)
            } else {
                // 处理文件系统模块
                let path = module_specifier.to_file_path().map_err(|_| {
                    ModuleLoaderError::from(io::Error::new(
                        io::ErrorKind::InvalidInput,
                        format!("无法将 '{}' 转换为文件路径", module_specifier),
                    ))
                })?;

                let code = std::fs::read_to_string(&path)?;

                // 创建 ModuleSource
                let module = ModuleSource::new(
                    ModuleType::JavaScript,
                    ModuleSourceCode::String(FastString::from(code)),
                    &module_specifier,
                    None,
                );

                Ok(module)
            }
        })())
    }
}

async fn run_js(file_path: &str) -> Result<(), CoreError> {
    let main_module = deno_core::resolve_path(file_path, &std::env::current_dir()?.as_path())
        .map_err(JsErrorBox::from_err)?;

    // 使用自定义模块加载器
    let module_loader = Rc::new(EJSRModuleLoader);

    let mut js_runtime = deno_core::JsRuntime::new(deno_core::RuntimeOptions {
        module_loader: Some(module_loader),
        extensions: vec![ejsr_extensions::init_ops()],
        ..Default::default()
    });

    // 先加载内部运行时模块作为side module
    let internal_module = ModuleSpecifier::parse("ejsr:runtime/index.js")?;
    let internal_mod_id = js_runtime.load_side_es_module(&internal_module).await?;
    let internal_result = js_runtime.mod_evaluate(internal_mod_id);

    // 再加载用户的主模块
    let mod_id = js_runtime.load_main_es_module(&main_module).await?;
    let result = js_runtime.mod_evaluate(mod_id);

    js_runtime.run_event_loop(Default::default()).await?;
    internal_result.await?;
    result.await
}

fn main() {
    let args = &env::args().collect::<Vec<String>>()[1..];

    if args.is_empty() {
        eprintln!("Usage: ejsr <file>");
        std::process::exit(1);
    }
    let file_path = &args[0];

    let runtime = tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()
        .unwrap();
    if let Err(error) = runtime.block_on(run_js(file_path)) {
        eprintln!("error: {error}");
    }
}
