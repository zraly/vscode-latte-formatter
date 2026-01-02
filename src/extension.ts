import * as vscode from 'vscode';
import { LatteFormatter } from './LatteFormatter';

export function activate(context: vscode.ExtensionContext) {
    const formatter = new LatteFormatter();

    context.subscriptions.push(
        vscode.languages.registerDocumentFormattingEditProvider('latte', formatter)
    );
}

export function deactivate() {}
