import * as vscode from 'vscode';

const VIEWS = {
	'oneMoreCoffee': 'coffees-count'
};

export function activate(context: vscode.ExtensionContext) {
	const provider = new CoffeesViewProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(CoffeesViewProvider.viewType, provider)
	);

	provider.resetIfADayHasPassed();
	provider.resetIfAYearHasPassed();

	provider.view?.onDidReceiveMessage(message => {
		switch (message.command) {
			case 'incrementCoffee':
				provider.incrementCoffee();
		}
	});

	context.subscriptions.push(vscode.commands.registerCommand('one-more-coffee.reset-count', () => {
		provider.reset();
	}));
}

class CoffeesViewProvider implements vscode.WebviewViewProvider {
	public view?: vscode.Webview;
	public static readonly viewType = VIEWS.oneMoreCoffee;
	private readonly _extensionUri: vscode.Uri;

	private _coffeesCountInYear = 0;
	private _coffeesCountToday = 0;
	private _date: string | null = null;

	constructor(
		extensionUri: vscode.Uri
	) {
		this._extensionUri = extensionUri;
	}

	public resolveWebviewView(webviewView: vscode.WebviewView, ctx: vscode.WebviewViewResolveContext<{ coffeesInYear: number, coffeesToday: number, date: string | null }>) {
		this.view = webviewView.webview;
		
		webviewView.webview.options = {
			enableScripts: true
		};
		this._coffeesCountToday = ctx.state?.coffeesToday || 0;
		this._coffeesCountInYear = ctx.state?.coffeesInYear || 0;
		this._date = ctx.state?.date || null;

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
	}

	private _getHtmlForWebview(webview: vscode.Webview, script?: string) {
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

					${script ? script : ''}
				</body>
			</html>
		`;
	}

	public incrementCoffee() {
		this._coffeesCountInYear = this._coffeesCountInYear + 1;
		this._coffeesCountToday = this._coffeesCountToday + 1;
	}

	public resetIfADayHasPassed() {
		const today = new Date();
		if (!this._date) {
			return;
		}
		if (today.getDay() !== new Date(this._date).getDay()) {
			this.reset();
		}
	}

	public resetIfAYearHasPassed() {
		const today = new Date();
		if (!this._date) {
			return;
		}
		if (today.getFullYear() !== new Date(this._date).getFullYear()) {
			this.reset();
		}
	}

	public reset() {
		if (!this.view) {
			return;
		};
		this._coffeesCountInYear = 0;
		this._coffeesCountToday = 0;
		this.view.html = this._getHtmlForWebview(this.view, `
			<script>
				vscode.setState({ coffeesToday: 0, coffeesInYear: 0, date: null });
			</script>
		`);
	}
}