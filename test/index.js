import expected from "./expected.js";
import getCssUsed from "../src/main.js";

getCssUsed(document.documentElement).then(res => {
  if (res.success && res.css === expected(location.port)) {
    console.log("Test Passed.");
  } else {
    console.log("Test fail.");
    console.dir({
      expect: expected(location.port),
      actual: res.css
    });
  }
})

getCssUsed(document.querySelectorAll('p')[0]).then(r => console.log(r.css))
