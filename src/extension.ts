import * as vscode from 'vscode';

const VIEWS = {
	'oneMoreCoffee': 'coffees-count'
};

export function activate(context: vscode.ExtensionContext) {
	const provider = new CoffeesViewProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(CoffeesViewProvider.viewType, provider)
	);
}

class CoffeesViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = VIEWS.oneMoreCoffee;
	private readonly _extensionUri: vscode.Uri;
	private coffeesCount = 0;

	constructor(
		extensionUri: vscode.Uri
	) {
		this._extensionUri = extensionUri;
	}

	public resolveWebviewView(webviewView: vscode.WebviewView) {
		webviewView.webview.options = {
			enableScripts: true
		};
		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
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
						<h1>My quantity of coffees today is ${this.coffeesCount}</h1>
						<img alt="First coffee icon" src="https://www.gifcen.com/wp-content/uploads/2022/08/coffee-gif.gif" />
						<button class='button add-coffee'>
							Drink one more coffee
						</button>
					</main>

					<script>
						const buttonAddCoffee = document.querySelector('.add-coffee');

						buttonAddCoffee.addEventListener('click', function (e) {
							console.log("oioio");
							incrementCoffee();
						});
					</script>
				</body>
			</html>
		`;
	}

	public incrementCoffee() {
		this.coffeesCount = this.coffeesCount + 1;
	}
}