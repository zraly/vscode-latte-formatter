"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const LatteCore_1 = require("./src/LatteCore");
const testInput = `
<div class="test">
    {if $var}
        <span>{$content}</span>
    {/if}
</div>`;
const core = new LatteCore_1.LatteCore();
core.format(testInput, { tabWidth: 4, useTabs: false })
    .then(formatted => {
    console.log("--- Input ---");
    console.log(testInput);
    console.log("\n--- Formatted ---");
    console.log(formatted);
})
    .catch(err => console.error(err));
//# sourceMappingURL=manual_test.js.map