use deno_core::op2;

#[op2(async)]
#[string]
pub async fn op_read_file(#[string] path: String) -> Result<String, std::io::Error> {
    let contents = tokio::fs::read_to_string(path).await?;
    Ok(contents)
}

#[op2(async)]
pub async fn op_write_file(
    #[string] path: String,
    #[string] contents: String,
) -> Result<(), std::io::Error> {
    tokio::fs::write(path, contents).await?;
    Ok(())
}

#[op2(fast)]
pub fn op_remove_file(#[string] path: String) -> Result<(), std::io::Error> {
    std::fs::remove_file(path)?;
    Ok(())
}
