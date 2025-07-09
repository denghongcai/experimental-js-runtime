use deno_core::error::AnyError;
use deno_core::op;
use md5;

#[op]
fn op_md5_hash(data: String) -> Result<String, AnyError> {
  let digest = md5::compute(data.as_bytes());
  let hex_string = format!("{:x}", digest);
  Ok(hex_string)
}
