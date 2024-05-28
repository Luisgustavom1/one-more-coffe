import * as vscode from 'vscode';
import { OneMoreCoffeeState } from './model';

const VIEWS = {
	'oneMoreCoffee': 'coffees-count'
};

const STATE_KEYS = {
	'oneMoreCoffee': 'oneMoreCoffee'
};

export function activate(context: vscode.ExtensionContext) {
	const provider = new CoffeesViewProvider(context.extensionUri, context.globalState);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(CoffeesViewProvider.viewType, provider, {
			webviewOptions: {
				retainContextWhenHidden: true
			}
		})
	);

	context.subscriptions.push(vscode.commands.registerCommand('one-more-coffee.reset-count', () => {
		provider.resetAll();
	}));
}

class CoffeesViewProvider implements vscode.WebviewViewProvider {
	public static readonly viewType = VIEWS.oneMoreCoffee;

	public _view?: vscode.Webview;
	private _disposables: vscode.Disposable[] = [];

	constructor(
		private readonly _extensionUri: vscode.Uri,
		private readonly globalState: vscode.ExtensionContext['globalState']
	) {}

	public resolveWebviewView(webviewView: vscode.WebviewView) {
		this._view = webviewView.webview;
		this._view.options = {
			enableScripts: true
		};

		this._view.html = this._getHtmlForWebview(this._view);

		this.resetIfADayHasPassed();
		this.resetIfAYearHasPassed();
		
		this._view?.onDidReceiveMessage(message => {
			switch (message.command) {
				case 'incrementCoffee':
					this.incrementCoffee();
				}
			},
			undefined,
			this._disposables
		);
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		const scriptMainPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'js', 'main.js');
		const scriptMain = webview.asWebviewUri(scriptMainPath);
		
		const stylesMainPath = vscode.Uri.joinPath(this._extensionUri, 'media', 'styles', 'styles.css');
		const stylesMain = webview.asWebviewUri(stylesMainPath);

		const state = this._getState();

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
						<h1>Coffees brewed today: <strong class="today-counting-coffees">${state.coffeesInYear}</strong></h1>
						<img alt="First coffee icon" src="https://www.gifcen.com/wp-content/uploads/2022/08/coffee-gif.gif" />
						<span>
							<p>Coffees brewed in ${new Date().getFullYear()}: 
								<strong class="year-counting-coffees">${state.coffeesToday}</strong>
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
		const currentState = this._getState();
		const newState: OneMoreCoffeeState = {
			coffeesInYear: currentState.coffeesInYear + 1,
			coffeesToday: currentState.coffeesToday + 1,
		};
		if (!currentState.date) {
			newState.date = new Date().toISOString();
		}

		this._updateState(newState);

		this._view!.html = this._getHtmlForWebview(this._view!);	
	}

	public resetIfADayHasPassed() {
		const currentState = this._getState();

		if (!currentState.date || !this._view) {
			return;
		}

		const today = new Date();
		const aDayHasPassed = today.getDay() > new Date(currentState.date).getDay();
		if (!aDayHasPassed) {
			return;
		}			

		this._updateState({
			coffeesToday: 0
		});

		this._view.html = this._getHtmlForWebview(this._view);		
	}

	public resetIfAYearHasPassed() {
		const currentState = this._getState();
		if (!currentState.date) {
			return;
		}

		const aYearHasPassed = new Date().getFullYear() !== new Date(currentState.date).getFullYear();
		if (!aYearHasPassed) {
			return;
		}
			
		this.resetAll();
	}

	public resetAll() {
		if (!this._view) {
			return;
		};

		this._updateState({
			coffeesInYear: 0,
			coffeesToday: 0,
			date: undefined
		});

		this._view.html = this._getHtmlForWebview(this._view);	
	}

	private _getState(): OneMoreCoffeeState {
		return this.globalState.get(STATE_KEYS.oneMoreCoffee) ?? {
			coffeesInYear: 0,
			coffeesToday: 0,
		};
	} 

	private _updateState(state: Partial<OneMoreCoffeeState>) {
		this.globalState.update(STATE_KEYS.oneMoreCoffee, {
			...this._getState(),
			...state,
		});
	}
}