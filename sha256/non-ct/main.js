const assert = require('assert');
const {readFile} = require('fs');
const {promisify} = require('util');
const readFileAsync = promisify(readFile);

async function instance(fname, i) {
  let f = await readFileAsync(__dirname + '/' + fname);
  return await WebAssembly.instantiate(f, i);
}

async function testSha256() {
  /* Compile and instantiate module */
  const s = await instance("sha256.wasm", {});
  const sha256 = s.instance.exports;

  const karr_base = 91;
  const hash_base = 620;
  const hash_len = 32;
  const input_base = 652;

  /* load k array */
  const k = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
  ];
  let mem = new Int32Array(sha256.memory.buffer);
  let memb = new Uint8Array(sha256.memory.buffer);
  for (let i = 0; i < 64; i++) {
    mem[karr_base + i] = k[i];
  }

  /* test initialization */
  sha256.init();
  assert.deepEqual(mem.slice(0, 11), new Int32Array([
    0, // datalen
    0, 0, // bitlen
    0x6a09e667,
    0xbb67ae85,
    0x3c6ef372,
    0xa54ff53a,
    0x510e527f,
    0x9b05688c,
    0x1f83d9ab,
    0x5be0cd19
  ]));

  /* test empty string */
  sha256.init();
  sha256.update(0);
  sha256.final();
  assert.deepEqual(memb.slice(hash_base, hash_base + hash_len), new Uint8Array([
    0xe3,0xb0,0xc4,0x42,0x98,0xfc,0x1c,0x14,0x9a,0xfb,0xf4,0xc8,0x99,0x6f,0xb9,0x24,
    0x27,0xae,0x41,0xe4,0x64,0x9b,0x93,0x4c,0xa4,0x95,0x99,0x1b,0x78,0x52,0xb8,0x55
  ]));

  let msg;
  let buf;

  /* test "a" */
  sha256.init();
  msg = "a";
  buf = Buffer.from(msg);
  for (let i = 0; i < buf.length; i++) {
    memb[input_base + i] = buf[i];
  }
  sha256.update(buf.length);
  sha256.final();
  assert.deepEqual(memb.slice(hash_base, hash_base + hash_len), new Uint8Array([
    0xca,0x97,0x81,0x12,0xca,0x1b,0xbd,0xca,0xfa,0xc2,0x31,0xb3,0x9a,0x23,0xdc,0x4d,
    0xa7,0x86,0xef,0xf8,0x14,0x7c,0x4e,0x72,0xb9,0x80,0x77,0x85,0xaf,0xee,0x48,0xbb
  ]));

  /* test "abc" */
  sha256.init();
  msg = "abc";
  buf = Buffer.from(msg);
  for (let i = 0; i < buf.length; i++) {
    memb[input_base + i] = buf[i];
  }
  sha256.update(buf.length);
  sha256.final();
  assert.deepEqual(memb.slice(hash_base, hash_base + hash_len), new Uint8Array([
    0xba,0x78,0x16,0xbf,0x8f,0x01,0xcf,0xea,0x41,0x41,0x40,0xde,0x5d,0xae,0x22,0x23,
    0xb0,0x03,0x61,0xa3,0x96,0x17,0x7a,0x9c,0xb4,0x10,0xff,0x61,0xf2,0x00,0x15,0xad
  ]));

  /* test "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq" */
  sha256.init();
  msg = "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq";
  buf = Buffer.from(msg);
  for (let i = 0; i < buf.length; i++) {
    memb[input_base + i] = buf[i];
  }
  sha256.update(buf.length);
  sha256.final();
  assert.deepEqual(memb.slice(hash_base, hash_base + hash_len), new Uint8Array([
    0x24,0x8d,0x6a,0x61,0xd2,0x06,0x38,0xb8,0xe5,0xc0,0x26,0x93,0x0c,0x3e,0x60,0x39,
    0xa3,0x3c,0xe4,0x59,0x64,0xff,0x21,0x67,0xf6,0xec,0xed,0xd4,0x19,0xdb,0x06,0xc1
  ]));

  /* test "aaaaaaaaaa" */
  sha256.init();
  msg = "aaaaaaaaaa";
  buf = Buffer.from(msg);
  for (let i = 0; i < buf.length; i++) {
    memb[input_base + i] = buf[i];
  }
  sha256.update(buf.length);
  sha256.final();
  assert.deepEqual(memb.slice(hash_base, hash_base + hash_len), new Uint8Array([
    0xcd,0xc7,0x6e,0x5c,0x99,0x14,0xfb,0x92,0x81,0xa1,0xc7,0xe2,0x84,0xd7,0x3e,0x67,
    0xf1,0x80,0x9a,0x48,0xa4,0x97,0x20,0x0e,0x04,0x6d,0x39,0xcc,0xc7,0x11,0x2c,0xd0
  ]));
}

testSha256().catch(err => console.log(err));
