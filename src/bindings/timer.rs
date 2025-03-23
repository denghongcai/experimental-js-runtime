use deno_core::op2;

#[op2(async)]
pub async fn op_set_timeout(delay: f64) {
    tokio::time::sleep(std::time::Duration::from_millis(delay as u64)).await;
}
