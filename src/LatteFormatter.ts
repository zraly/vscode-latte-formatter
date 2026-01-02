import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import { LatteCore } from './LatteCore';

export class LatteFormatter implements vscode.DocumentFormattingEditProvider {
    private core = new LatteCore();

    public async provideDocumentFormattingEdits(
        document: vscode.TextDocument,
        options: vscode.FormattingOptions,
        token: vscode.CancellationToken
    ): Promise<vscode.TextEdit[]> {
        const text = document.getText();

        try {
            const formatted = await this.core.format(text, async (maskedText) => {
                // Create a temporary file for HTML formatting
                // This avoids the Untitled document problem
                const tempDir = os.tmpdir();
                const tempFile = path.join(tempDir, `latte-format-${Date.now()}.html`);

                try {
                    // Write masked text to temp file
                    fs.writeFileSync(tempFile, maskedText, 'utf8');

                    // Open the temp file as a document
                    const tempUri = vscode.Uri.file(tempFile);
                    const tempDoc = await vscode.workspace.openTextDocument(tempUri);

                    // Execute the HTML formatting command
                    const edits = await vscode.commands.executeCommand<vscode.TextEdit[]>(
                        'vscode.executeFormatDocumentProvider',
                        tempUri,
                        options
                    );

                    if (!edits || edits.length === 0) {
                        return maskedText;
                    }

                    // Apply edits to get the formatted text
                    return this.applyEdits(maskedText, edits, tempDoc);
                } finally {
                    // Clean up temp file
                    try {
                        fs.unlinkSync(tempFile);
                    } catch (e) {
                        // Ignore cleanup errors
                    }
                }
            });

            const fullRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(text.length)
            );
            return [vscode.TextEdit.replace(fullRange, formatted)];
        } catch (e) {
            console.error('Latte formatting failed', e);
            return [];
        }
    }

    private applyEdits(text: string, edits: vscode.TextEdit[], doc: vscode.TextDocument): string {
        // Sort edits in reverse order to apply without shifting offsets
        const sortedEdits = edits.sort((a, b) => b.range.start.compareTo(a.range.start));

        let result = text;

        for (const edit of sortedEdits) {
            const startOffset = doc.offsetAt(edit.range.start);
            const endOffset = doc.offsetAt(edit.range.end);
            result = result.substring(0, startOffset) + edit.newText + result.substring(endOffset);
        }

        return result;
    }
}
