async function test() {
  try {
    const res = await fetch('http://localhost:3000/check-module/voxglitch-devices/circuit_bender');
    const json = await res.json();
    console.log(json);
  } catch (e) {
    console.error(e);
  }
}

test();