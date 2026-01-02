
import * as assert from 'assert';

// Mock LatteCore class (simplified - matching current impl)
class LatteCore {
    private maskIdCounter = 0;

    public mask(text: string): { maskedText: string, maskMap: Map<string, string> } {
        const maskMap = new Map<string, string>();
        this.maskIdCounter = 0;

        const latteTagRegex = /{(?![ \t\r\n'"{])(?:[^{}"']|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')*}/g;

        const maskedText = text.replace(latteTagRegex, (match) => {
            const id = this.maskIdCounter++;
            const placeholderId = `__LATTE_MASK_${id}__`;
            maskMap.set(placeholderId, match);

            const content = match.slice(1, -1).trim();

            if (content.startsWith('/')) {
                return `</latte-block><!--${placeholderId}-->`;
            }
            if (/^(else|elseif|catch)/.test(content)) {
                return `</latte-block><latte-split data-id="${placeholderId}"></latte-split><latte-block>`;
            }
            if (/^(if|foreach|block|for|while|switch|try|snippet|translator|embed|cache|sandbox|form)\b/.test(content)) {
                return `<latte-block data-id="${placeholderId}">`;
            }
            return `<latte-inline data-id="${placeholderId}"></latte-inline>`;
        });

        return { maskedText, maskMap };
    }

    public unmask(text: string, maskMap: Map<string, string>): string {
        let result = text;

        // Helper regex part for quotes: matches ", ', &quot;, &#39;
        const q = `(?:["']|&quot;|&#39;)`;

        // 1. Replace <latte-block data-id="..."> with original
        // Broad regex
        result = result.replace(new RegExp(`<latte-block[^>]*data-id\\s*=\\s*${q}?(__LATTE_MASK_\\d+__)${q}?[^>]*>`, 'gi'), (match, id) => {
            return maskMap.get(id) || match;
        });

        // 2. Replace </latte-block><!--__LATTE_MASK_...-->
        result = result.replace(/<\/latte-block>\s*<!--(__LATTE_MASK_\d+__)-->/gi, (match, id) => {
            return maskMap.get(id) || match;
        });

        // 3. Replace <latte-split ...>
        result = result.replace(new RegExp(`<\/latte-block>\\s*<latte-split[^>]*data-id\\s*=\\s*${q}?(__LATTE_MASK_\\d+__)${q}?[^>]*><\/latte-split>\\s*<latte-block>`, 'gi'), (match, id) => {
            return maskMap.get(id) || match;
        });

        // 4. Replace inline masks (<latte-inline>)
        result = result.replace(new RegExp(`<latte-inline[^>]*data-id\\s*=\\s*${q}?(__LATTE_MASK_\\d+__)${q}?[^>]*><\/latte-inline>`, 'gi'), (match, id) => {
            return maskMap.get(id) || match;
        });

        // 5. Replace comment masks
        result = result.replace(/<!--(__LATTE_MASK_\d+__)-->/g, (match, id) => {
            return maskMap.get(id) || match;
        });

        // 6. Cleanup stray </latte-block> tags
        result = result.replace(/<\/latte-block>/gi, '');

        // 7. Replace simple inline masks
        result = result.replace(/__LATTE_MASK_\d+__/g, (match) => {
            return maskMap.get(match) || match;
        });

        return result;
    }
}

// User input (snippet that failed)
const userInput = `
{block content}

{translator admin.homepage}
	<div class="flex flex-col gap-6 justify-between lg:flex-row mb-6">
		<h1 class="text-3xl font-bold">{_projects}</h1>
	</div>
	{if count($projectList) > 0}
		<table class="w-full">
			<thead class="">
			<tr>
				<th>
					<span @click="sort"
						  data-sort-button
						  class="cursor-pointer hover:text-brand whitespace-nowrap sticky top-0">
						{_name}
					</span>
				</th>
			</tr>
			</thead>
			<tbody x-data="{ filterBy: $persist('').using(sessionStorage) }">
			{foreach $projectList as $projectItem}
				<tr>
					<td class="font-normal align-top" data-sort="{$projectItem->name}">
						<a class="font-bold hover:underline" n:href="Homepage:default"
						   @click="filterBy = 'project:{$projectItem->name}'">{$projectItem->name}</a>
					</td>
				</tr>
			{/foreach}
			</tbody>
		</table>
	{else}
		<div class="my-6 overflow-x-auto shadow p-24 rounded-xl bg-white grid gap-6">
			<p>Empty</p>
		</div>
	{/if}
{/translator}
`;

const core = new LatteCore();
const { maskedText, maskMap } = core.mask(userInput);

console.log('--- Masked Text ---');
console.log(maskedText);

// Simulate "Hostile" Formatter Mutations

// 1. Simulating spacing and quoting changes
const mutated1 = maskedText.replace(/data-id="(__LATTE_MASK_\d+__)"/g, "data-id = '$1' ");
console.log('\n--- Mutated 1 (Quotes/Spaces) Check ---');
const unmasked1 = core.unmask(mutated1, maskMap);
if (unmasked1.includes('<latte-')) {
    console.error('FAILED: Unmasking failed on Mutated 1');
    console.log(unmasked1.slice(0, 500));
} else {
    console.log('PASSED: Mutated 1');
}


// 2. Simulating self-closing tags
const mutated2 = maskedText.replace(/<latte-block data-id="([^"]+)">/g, '<latte-block data-id="$1" />');
console.log('\n--- Mutated 2 (Self-closing) Check ---');
const unmasked2 = core.unmask(mutated2, maskMap);
if (unmasked2.includes('<latte-')) {
    console.error('FAILED: Unmasking failed on Mutated 2');
    console.log(unmasked2.slice(0, 500));
} else {
    console.log('PASSED: Mutated 2');
}

// 3. Simulating separated attribute lines
const mutated3 = maskedText.replace(/<latte-block data-id="([^"]+)">/g, '<latte-block\n data-id="$1"\n>');
console.log('\n--- Mutated 3 (Attributes on newlines) Check ---');
const unmasked3 = core.unmask(mutated3, maskMap);
if (unmasked3.includes('<latte-')) {
    console.error('FAILED: Unmasking failed on Mutated 3');
    console.log(unmasked3.slice(0, 500));
} else {
    console.log('PASSED: Mutated 3');
}

// 4. Simulating hoisting
const hoisted = `
<latte-block data-id="__LATTE_MASK_99__"></latte-block>
<table class="w-full">
    <tbody x-data="{ filterBy: $persist('').using(sessionStorage) }">
            <tr><td>Content</td></tr>
    </tbody>
</table>
`;
maskMap.set('__LATTE_MASK_99__', '{foreach ...}');

console.log('\n--- Mutated 4 (Hoisting) Check ---');
const unmasked4 = core.unmask(hoisted, maskMap);
if (unmasked4.includes('<latte-')) {
    console.error('FAILED: Unmasking failed on Mutated 4');
} else {
    console.log('PASSED: Mutated 4');
}

// 5. Simulating HTML Entity Encoding
const mutated5 = maskedText.replace(/data-id="([^"]+)"/g, 'data-id=&quot;$1&quot;');
console.log('\n--- Mutated 5 (HTML Entities) Check ---');
const unmasked5 = core.unmask(mutated5, maskMap);
if (unmasked5.includes('<latte-')) {
    console.error('FAILED: Unmasking failed on Mutated 5 (Entities)');
    console.log(unmasked5.slice(0, 500));
} else {
    console.log('PASSED: Mutated 5');
}
