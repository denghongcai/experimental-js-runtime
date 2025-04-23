use deno_core::op2;
use deno_error::JsErrorBox;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Deserialize)]
struct RequestInit {
    method: Option<String>,
    headers: Option<HashMap<String, String>>,
    body: Option<String>,
}

#[op2(async)]
#[serde]
pub async fn op_fetch(
    #[string] url: String,
    #[serde] init: Option<RequestInit>,
) -> Result<FetchResponse, JsErrorBox> {
    let client = reqwest::Client::new();

    // 创建请求
    let mut request_builder = match init.as_ref().and_then(|i| i.method.as_ref()) {
        Some(method) => client.request(
            method
                .parse::<reqwest::Method>()
                .map_err(|e| JsErrorBox::type_error(format!("Invalid method: {}", e)))?,
            &url,
        ),
        None => client.get(&url),
    };

    // 添加请求头
    if let Some(init) = &init {
        if let Some(headers) = &init.headers {
            for (key, value) in headers {
                request_builder = request_builder.header(key, value);
            }
        }

        // 添加请求体
        if let Some(body) = &init.body {
            request_builder = request_builder.body(body.clone());
        }
    }

    // 执行请求
    let response = request_builder
        .send()
        .await
        .map_err(|e| JsErrorBox::type_error(e.to_string()))?;

    // 提取响应信息
    let response_url = response.url().to_string();
    let status = response.status().as_u16();
    let status_text = response
        .status()
        .canonical_reason()
        .unwrap_or("")
        .to_string();
    let redirected = response.status().is_redirection();

    // 提取响应头
    let mut headers = HashMap::new();
    for (key, value) in response.headers() {
        if let Ok(value_str) = value.to_str() {
            headers.insert(key.to_string(), value_str.to_string());
        }
    }

    // 获取响应体
    let body = response
        .text()
        .await
        .map_err(|e| JsErrorBox::type_error(e.to_string()))?;

    // 构建响应对象
    let response_init = FetchResponse {
        url: response_url,
        status,
        status_text,
        headers,
        redirected,
        body,
    };

    Ok(response_init)
}

#[derive(Debug, Serialize)]
pub struct FetchResponse {
    url: String,
    status: u16,
    status_text: String,
    headers: HashMap<String, String>,
    redirected: bool,
    body: String,
}
