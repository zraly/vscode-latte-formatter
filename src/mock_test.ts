import { LatteCore } from './LatteCore';

const testInput = `
<div class="test">
    {block unclosed}
    <div class="header">
        {translator admin.homepage}
            <h1>{_projects}</h1>
        {/translator}
    </div>
</div>
`;

const core = new LatteCore();

// Mock formatter that just trims lines (simple simulation)
// In real extension, this will be VS Code's HTML formatter
const mockFormatter = async (text: string): Promise<string> => {
    console.log('--- Masked Text (sent to formatter) ---');
    console.log(text);
    console.log('---------------------------------------');

    // Simulate some basic formatting: indenting based on nesting
    // This is a VERY dumb formatter just to prove round-trip works
    return text.split('\n').map(line => line.trim()).join('\n');
};

(async () => {
    try {
        console.log('--- Input ---');
        console.log(testInput);

        const formatted = await core.format(testInput, mockFormatter);

        console.log('\n--- Formatted Output (Mock) ---');
        console.log(formatted);
    } catch (e) {
        console.error('Error:', e);
    }
})();
