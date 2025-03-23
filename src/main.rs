// main.rs
use deno_core::error::CoreError;
use deno_error::JsErrorBox;
use std::rc::Rc;
pub mod bindings;
use bindings::ejsr_extensions;

async fn run_js(file_path: &str) -> Result<(), CoreError> {
    let main_module = deno_core::resolve_path(file_path, &std::env::current_dir()?.as_path())
        .map_err(JsErrorBox::from_err)?;
    let mut js_runtime = deno_core::JsRuntime::new(deno_core::RuntimeOptions {
        module_loader: Some(Rc::new(deno_core::FsModuleLoader)),
        extensions: vec![ejsr_extensions::init_ops()],
        ..Default::default()
    });

    let internal_mod_id = js_runtime
        .load_side_es_module_from_code(
            &deno_core::ModuleSpecifier::parse("ejsr:runtime/index.js")?,
            include_str!("runtime/index.js"),
        )
        .await?;
    let internal_result = js_runtime.mod_evaluate(internal_mod_id);

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
