import escapeRegExp from 'lodash/escapeRegExp';
import { $config } from 'src/extension';
import { Constants, type ExtensionConfig } from 'src/types';
import { extensionUtils } from 'src/utils/extensionUtils';
import { vscodeUtils } from 'src/utils/vscodeUtils';
import { window, type Diagnostic } from 'vscode';

export async function excludeProblemCommand(diagnostic: Diagnostic): Promise<void> {
	const code = extensionUtils.getDiagnosticCode(diagnostic);
	const source = diagnostic.source;
	if (!source) {
		showExcludeByMessageNotification(`Diagnostic has no "source".`, diagnostic);
		return;
	}
	if (!code) {
		showExcludeByMessageNotification(`Diagnostic has no "code".`, diagnostic);
		return;
	}

	const sourceCodeString = extensionUtils.diagnosticToSourceCodeString(source, code);

	if ($config.excludeBySource.includes(sourceCodeString)) {
		return;
	}

	await vscodeUtils.updateGlobalSetting(`${Constants.SettingsPrefix}.${'excludeBySource' satisfies keyof ExtensionConfig}`, [
		...$config.excludeBySource,
		sourceCodeString,
	]);

	showCompletionNotification(sourceCodeString);
}

async function showExcludeByMessageNotification(message: string, diagnostic: Diagnostic): Promise<void> {
	const messageToExclude = escapeRegExp(await window.showInputBox({
		title: `${message}: Exclude by message:`,
		value: diagnostic.message,
	}));
	if (!messageToExclude) {
		return;
	}
	if ($config.exclude.includes(messageToExclude)) {
		return;
	}
	await vscodeUtils.updateGlobalSetting(`${Constants.SettingsPrefix}.${'exclude' satisfies keyof ExtensionConfig}`, [
		...$config.exclude,
		messageToExclude,
	]);

	showCompletionByMessageNotification(messageToExclude);
}

async function showCompletionByMessageNotification(messageToExclude: string): Promise<void> {
	const openSettingsButton = 'Open Setting';
	const pressedButton = await window.showInformationMessage(`Excluded problem by message: "${messageToExclude}"`, openSettingsButton);

	if (pressedButton === openSettingsButton) {
		vscodeUtils.openSettingGuiAt(`@ext:${Constants.ExtensionId} ${Constants.SettingsPrefix}.${'exclude' satisfies keyof ExtensionConfig}`);
	}
}

async function showCompletionNotification(sourceCodeString: string): Promise<void> {
	const openSettingsButton = 'Open Setting';
	const pressedButton = await window.showInformationMessage(`Excluded problem by source+code: "${sourceCodeString}"`, openSettingsButton);

	if (pressedButton === openSettingsButton) {
		vscodeUtils.openSettingGuiAt(`@ext:${Constants.ExtensionId} ${'excludeBySource' satisfies keyof ExtensionConfig}`);
	}
}
