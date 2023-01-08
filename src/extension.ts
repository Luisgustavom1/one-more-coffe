import * as vscode from 'vscode';

const VIEWS = {
	'oneMoreCoffee': 'coffees-count'
};

export function activate(context: vscode.ExtensionContext) {
	const provider = new CoffeesViewProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(CoffeesViewProvider.viewType, provider)
	);

	provider.view?.onDidReceiveMessage(message => {
		switch (message.command) {
			case 'incrementCoffee':
				provider.incrementCoffee();
		}
	});

	context.subscriptions.push(vscode.commands.registerCommand('one-more-coffee.reset-count', () => {
		provider.reset();
		context.globalState.update('coffeesToday', 0);
		context.globalState.update('coffeesInYear', 0);
	}));
}

class CoffeesViewProvider implements vscode.WebviewViewProvider {
	public view?: vscode.Webview;
	public static readonly viewType = VIEWS.oneMoreCoffee;
	private _coffeesCountInYear = 0;
	private _coffeesCountToday = 0;
	private readonly _extensionUri: vscode.Uri;

	constructor(
		extensionUri: vscode.Uri
	) {
		this._extensionUri = extensionUri;
	}

	public resolveWebviewView(webviewView: vscode.WebviewView, ctx: vscode.WebviewViewResolveContext<{ coffeesInYear: number, coffeesToday: number }>) {
		this.view = webviewView.webview;
		webviewView.webview.options = {
			enableScripts: true
		};
		this._coffeesCountToday = ctx.state?.coffeesToday || 0;
		this._coffeesCountInYear = ctx.state?.coffeesInYear || 0;

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		const scriptMainPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'js', 'main.js');
		const scriptMain = webview.asWebviewUri(scriptMainPath);
		
		const stylesMainPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'styles', 'styles.css');
		const stylesMain = webview.asWebviewUri(stylesMainPath);

		return `
			<!DOCTYPE html>
				<html lang="en">
				<head>
					<meta charset="UTF-8">

					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<link href="${stylesMain}" rel="stylesheet">

					<title>Coffees count</title>
				</head>
				<body>
					<main>
						<h1>Coffees brewed today: <strong class="today-counting-coffees">${this._coffeesCountToday}</strong></h1>
						<img alt="First coffee icon" src="https://www.gifcen.com/wp-content/uploads/2022/08/coffee-gif.gif" />
						<span>
							<p>Coffees brewed in ${new Date().getFullYear()}: 
								<strong class="year-counting-coffees">${this._coffeesCountInYear}</strong>
							</p>
						</span>
						<button class='button add-coffee'>
							Drink one more coffee
						</button>
					</main>

					<script src="${scriptMain}"></script>
				</body>
			</html>
		`;
	}

	public incrementCoffee() {
		this._coffeesCountInYear = this._coffeesCountInYear + 1;
		this._coffeesCountToday = this._coffeesCountToday + 1;
	}

	public reset() {
		if (!this.view) {
			return;
		};
		this._coffeesCountInYear = 0;
		this._coffeesCountToday = 0;
		this.view.html = this._getHtmlForWebview(this.view);
	}
}