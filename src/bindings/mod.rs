use deno_core::extension;

pub mod fetch;
pub mod fs;
pub mod timer;
pub mod crypto;

extension!(
    ejsr_extensions,
    ops = [
        fs::op_read_file,
        fs::op_write_file,
        fs::op_remove_file,
        fetch::op_fetch,
        timer::op_set_timeout,
        crypto::op_md5_hash,
    ]
);
