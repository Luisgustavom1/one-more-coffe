import * as vscode from 'vscode';
import { OneMoreCoffeeState } from './model';

const VIEWS = {
	'oneMoreCoffee': 'coffees-count'
};

export function activate(context: vscode.ExtensionContext) {
	const provider = new CoffeesViewProvider(context.extensionUri);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(CoffeesViewProvider.viewType, provider, {
			webviewOptions: {
				retainContextWhenHidden: true
			}
		})
	);

	provider.view?.onDidReceiveMessage(message => {
		switch (message.command) {
			case 'incrementCoffee':
				provider.incrementCoffee();
		}
	});

	context.subscriptions.push(vscode.commands.registerCommand('one-more-coffee.reset-count', () => {
		provider.resetAll();
	}));
}

class CoffeesViewProvider implements vscode.WebviewViewProvider {
	public view?: vscode.Webview;
	public static readonly viewType = VIEWS.oneMoreCoffee;
	private readonly _extensionUri: vscode.Uri;

	private _state: OneMoreCoffeeState = {
		coffeesToday: 0,
		coffeesInYear: 0,
		date: null
	};

	constructor(
		extensionUri: vscode.Uri
	) {
		this._extensionUri = extensionUri;
	}

	public resolveWebviewView(webviewView: vscode.WebviewView, ctx: vscode.WebviewViewResolveContext<OneMoreCoffeeState>) {
		this.view = webviewView.webview;
		
		webviewView.webview.options = {
			enableScripts: true
		};
		this._state = ctx.state ?? this._state;

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		this.resetIfADayHasPassed();
		this.resetIfAYearHasPassed();
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
						<h1>Coffees brewed today: <strong class="today-counting-coffees">${this._state.coffeesInYear}</strong></h1>
						<img alt="First coffee icon" src="https://www.gifcen.com/wp-content/uploads/2022/08/coffee-gif.gif" />
						<span>
							<p>Coffees brewed in ${new Date().getFullYear()}: 
								<strong class="year-counting-coffees">${this._state.coffeesToday}</strong>
							</p>
						</span>
						<button class='button add-coffee'>
							Drink one more coffee
						</button>
					</main>
					
					<script src="${scriptMain}"></script>

					${script || ""}
				</body>
			</html>
		`;
	}

	public incrementCoffee() {
		this._state.coffeesToday = this._state.coffeesToday + 1;
		this._state.coffeesInYear = this._state.coffeesInYear + 1;
		if (!this._state.date) {
			this._state.date = new Date().toISOString();
		}
	}

	public resetIfADayHasPassed() {
		const today = new Date();
		if (!this._state.date || !this.view) {
			return;
		}
		if (today.getDay() !== new Date(this._state.date).getDay()) {
			this._state.coffeesInYear = 0;
			this.view.html = this._getHtmlForWebview(this.view, `
				<script>
					vscode.setState({ coffeesToday: 0, coffeesInYear: ${this._state.coffeesInYear}, date: "${this._state.date}" });
				</script>
			`);		
	}
	}

	public resetIfAYearHasPassed() {
		if (!this._state.date) {
			return;
		}
		if (new Date().getFullYear() !== new Date(this._state.date).getFullYear()) {
			this.resetAll();
		}
	}

	public resetAll() {
		if (!this.view) {
			return;
		};
		this._state.coffeesToday = 0;
		this._state.coffeesInYear = 0;
		this.view.html = this._getHtmlForWebview(this.view, `
			<script>
				vscode.setState({ coffeesToday: 0, coffeesInYear: 0, date: null });
			</script>
		`);	
	}
}