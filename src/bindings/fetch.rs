use deno_core::op2;
use deno_error::JsErrorBox;

#[op2(async)]
#[string]
pub async fn op_fetch(#[string] url: String) -> Result<String, JsErrorBox> {
    reqwest::get(url)
        .await
        .map_err(|e| JsErrorBox::type_error(e.to_string()))?
        .text()
        .await
        .map_err(|e| JsErrorBox::type_error(e.to_string()))
}
