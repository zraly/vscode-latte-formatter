type MaskingStrategy = 'block' | 'comment' | 'text';

export class LatteCore {
    public async format(text: string, formatCallback: (text: string) => Promise<string>): Promise<string> {
        try {
            return await this.formatWithStrategy(text, formatCallback, 'block');
        } catch (e) {
            console.warn('Latte formatting "block" strategy failed, retrying with "comment" strategy.');
            try {
                return await this.formatWithStrategy(text, formatCallback, 'comment');
            } catch (e2) {
                console.warn('Latte formatting "comment" strategy failed, retrying with "text" strategy.');
                try {
                    return await this.formatWithStrategy(text, formatCallback, 'text');
                } catch (e3) {
                    console.error('All Latte formatting strategies failed.', e3);
                    throw e3;
                }
            }
        }
    }

    private async formatWithStrategy(text: string, formatCallback: (text: string) => Promise<string>, strategy: MaskingStrategy): Promise<string> {
        const { maskedText, maskMap } = this.mask(text, strategy);

        const formatted = await formatCallback(maskedText);

        return this.unmask(formatted, maskMap);
    }

    private mask(text: string, strategy: MaskingStrategy): { maskedText: string, maskMap: Map<string, string> } {
        const maskMap = new Map<string, string>();
        let maskIdCounter = 0;

        // Regex to match Latte tags
        const latteTagRegex = /{(?![ \t\r\n'"{])(?:[^{}"']|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')*}/g;

        const maskedText = text.replace(latteTagRegex, (match, offset) => {
            const id = maskIdCounter++;
            const placeholderId = `__LATTE_MASK_${id}__`;

            maskMap.set(placeholderId, match);

            // Check context: Are we inside quotes?
            const prefix = text.slice(0, offset);
            const insideDouble = (prefix.match(/"/g) || []).length % 2 === 1;
            const insideSingle = (prefix.match(/'/g) || []).length % 2 === 1;

            if (insideDouble || insideSingle) {
                // Inside attribute or string -> Use opaque mask always
                return placeholderId;
            }

            if (strategy === 'text') {
                return placeholderId;
            }

            if (strategy === 'comment') {
                return `<!--${placeholderId}-->`;
            }

            // strategy === 'block'
            // Analyze the content of the match to decide on the masking strategy
            const content = match.slice(1, -1).trim(); // Remove { and }

            // Check for closing tags: starts with / (e.g. {/if})
            if (content.startsWith('/')) {
                const tagName = content.slice(1);
                // Only treat as block-closer if it matches our known block openers
                if (/^(if|ifset|ifchanged|foreach|block|for|while|switch|try|snippet|translator|translate|embed|cache|sandbox|form|define|first|last|sep|iterateWhile|capture|spaceless|label|formContainer)\b/.test(tagName)) {
                    return `</latte-block><!--${placeholderId}-->`;
                }
            }

            // Check for else/elseif/case/default (split tags - close and reopen block)
            // Note: {default} without parameters is a switch case, {default $var = value} is variable declaration
            if (/^(else|elseif|elseifset|catch|case)\b/.test(content) || /^default\s*$/.test(content)) {
                return `</latte-block><latte-split data-id="${placeholderId}"></latte-split><latte-block>`;
            }

            // Check for Openers (all block tags that have {/tag} closing)
            if (/^(if|ifset|ifchanged|foreach|block|for|while|switch|try|snippet|translator|translate|embed|cache|sandbox|form|define|first|last|sep|iterateWhile|capture|spaceless|label|formContainer)\b/.test(content)) {
                return `<latte-block data-id="${placeholderId}">`;
            }

            // Default: inline variable or unknown
            return `<latte-inline data-id="${placeholderId}"></latte-inline>`;
        });

        return { maskedText, maskMap };
    }

    private unmask(text: string, maskMap: Map<string, string>): string {
        // We need to handle the complex tags we generated.
        // We make regexes promiscuous to handle HTML formatter changes (including entity encoding).

        // Helper regex part for quotes: matches ", ', &quot;, &#39;
        const q = `(?:["']|&quot;|&#39;)`;

        // 1. Replace <latte-block data-id="..."> with original
        // Match <latte-block, any attributes, data-id="...", any attributes, >
        let result = text.replace(new RegExp(`<latte-block[^>]*data-id\\s*=\\s*${q}?(__LATTE_MASK_\\d+__)${q}?[^>]*>`, 'gi'), (match, id) => {
            return maskMap.get(id) || match;
        });

        // 2. Replace </latte-block><!--__LATTE_MASK_...-->
        // Flexible matching for whitespace and case
        result = result.replace(/<\/latte-block>\s*<!--(__LATTE_MASK_\d+__)-->/gi, (match, id) => {
            return maskMap.get(id) || match;
        });

        // 3. Replace <latte-split ...>
        result = result.replace(new RegExp(`<\\/latte-block>\\s*<latte-split[^>]*data-id\\s*=\\s*${q}?(__LATTE_MASK_\\d+__)${q}?[^>]*><\\/latte-split>\\s*<latte-block>`, 'gi'), (match, id) => {
            return maskMap.get(id) || match;
        });

        // 4. Replace inline masks (<latte-inline>)
        result = result.replace(new RegExp(`<latte-inline[^>]*data-id\\s*=\\s*${q}?(__LATTE_MASK_\\d+__)${q}?[^>]*><\\/latte-inline>`, 'gi'), (match, id) => {
            return maskMap.get(id) || match;
        });

        // 5. Replace comment masks <!--__LATTE_MASK_...-->
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
