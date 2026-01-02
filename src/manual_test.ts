import { LatteCore } from './LatteCore';

const testInput = `
<div class="test">
    {block unclosed}
    <div class="a-very-long-class-name-that-should-force-prettier-to-break-attributes-onto-new-lines-causing-my-regex-to-fail">
        <span
            class="another-long-class-name-to-ensure-wrapping-happens-deeply-nested"
            data-attribute="{var $veryLongVariableNameThatWillAlsoBeWrapped = 'some value'}"
        >
            Content
        </span>
    </div>
</div>
`;

const core = new LatteCore();

core.format(testInput, async (text) => text).then(result => {
    console.log("--- Input ---");
    console.log(testInput);
    console.log("\n--- Formatted ---");
    console.log(result);
})
    .catch(err => console.error(err));
