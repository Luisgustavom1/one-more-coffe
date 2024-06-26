import * as vscode from 'vscode';
import { OneMoreCoffeeState } from './model';
import { OneMoreCoffeeStateStorage } from './storage';

const ONE_DAY_IN_MILLISECONDS = 1000 * 60 * 60 * 24;

const VIEWS = {
  'oneMoreCoffee': 'coffees-count'
};

export function activate(context: vscode.ExtensionContext) {
  const storage = new OneMoreCoffeeStateStorage(context.globalState);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(CoffeesViewProvider.viewType, {
      resolveWebviewView: (webviewView) => {
        CoffeesViewProvider.init(context.extensionUri, webviewView, storage);
      }
    }, {
      webviewOptions: {
        retainContextWhenHidden: true,
      }
    })
  );

  context.subscriptions.push(vscode.commands.registerCommand('one-more-coffee.reset-count', () => {
    CoffeesViewProvider.resetAll();
  }));
}

const getCOrrectlyImageFromCoffees = (coffeeQuantity: number) => {
  if (coffeeQuantity > 4) {
    return 'five-coffees.png';
  }
  if (coffeeQuantity > 3) {
    return 'four-coffees.png';
  }
  if (coffeeQuantity > 2) {
    return 'three-coffee.png';
  }
  return 'without-coffee.png';
};

class CoffeesViewProvider {
  public static readonly viewType = VIEWS.oneMoreCoffee;

  private static _provider: CoffeesViewProvider | undefined;

  private _disposables: vscode.Disposable[] = [];

  constructor(
		private readonly _extensionUri: vscode.Uri,
		private readonly _view: vscode.Webview,
		private readonly _storage: OneMoreCoffeeStateStorage,
  ) {
		this._view.options = {
			enableScripts: true,
      localResourceRoots: [
          vscode.Uri.joinPath(_extensionUri, 'media')
      ]
		};
		this._update();

    this._resetIfADayHasPassed();
    this._resetIfAYearHasPassed();
    this._setupCommands();
  }

  static init(extensionUri: vscode.Uri, view: vscode.WebviewView, storage: OneMoreCoffeeStateStorage) {
    this._provider = new CoffeesViewProvider(extensionUri, view.webview, storage);
  }

  private _setupCommands() {
    this._view.onDidReceiveMessage(message => {
      switch (message.command) {
        case 'incrementCoffee':
          this._incrementCoffee();
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

    const state = this._storage.get();

    const coffeePath = vscode.Uri.joinPath(this._extensionUri, 'media', 'images', 'coffee-phases', getCOrrectlyImageFromCoffees(state.coffeesToday));
    const coffeePathSrc = this._view.asWebviewUri(coffeePath);

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
            <h1>Coffees brewed today: <strong class="today-counting-coffees">${state.coffeesToday}</strong></h1>
            <img alt="First coffee icon" src="${coffeePathSrc}" />
            <span>
              <p>Coffees brewed in ${new Date().getFullYear()}: 
                <strong class="year-counting-coffees">${state.coffeesInYear}</strong>
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

  public _incrementCoffee() {
    const currentState = this._storage.get();
    const newState: OneMoreCoffeeState = {
      coffeesInYear: currentState.coffeesInYear + 1,
      coffeesToday: currentState.coffeesToday + 1,
    };
    if (!currentState.date) {
      newState.date = new Date().toISOString();
    }

    this._storage.update(newState);

    this._update();
  }

  private _resetIfADayHasPassed() {
    const currentState = this._storage.get();
    if (!currentState.date) {
      return;
    }

    const today = new Date();
    const diff = today.getTime() - new Date(currentState.date).getTime()
    const aDayHasPassed = diff >= ONE_DAY_IN_MILLISECONDS;
    if (!aDayHasPassed) {
      return;
    }     

		this._storage.update({
      coffeesToday: 0,
			date: today.toISOString()
    });

    this._update();
  }

  private _resetIfAYearHasPassed() {
    const currentState = this._storage.get();
    if (!currentState.date) {
      return;
    }

    const aYearHasPassed = new Date().getFullYear() !== new Date(currentState.date).getFullYear();
    if (!aYearHasPassed) {
      return;
    }
      
    CoffeesViewProvider.resetAll();
  }

  private _update() {
    this._view.html = this._getHtmlForWebview(this._view);
  }

  static resetAll() {
    if (!this._provider) {
      return;
    }

    this._provider._storage.update({
      coffeesInYear: 0,
      coffeesToday: 0,
      date: new Date().toISOString() 
    });

    this._provider._update();
  }
}
