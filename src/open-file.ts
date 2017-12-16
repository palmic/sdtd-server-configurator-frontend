import {DOMParser} from 'xmldom';
import {App} from './app';
import {inject} from 'aurelia-framework';

@inject(App)
export class OpenFile {

	public error = '';

	public app: App;

	public rendering: boolean = true;
	public formSubmitting: boolean = false;

	constructor(app: App) {
		this.app = app;
		this.app.view = this
	}

	attached() {
		this.rendering = false;
	}

	loadingInProgress = () => {
		this.formSubmitting = true;
	};

	fileLoaded = (file, data) => {
		this.error = "";
		let reader = new FileReader();
		reader.readAsText(file);
		reader.onloadend = () => {
			this.app.doc = new DOMParser().parseFromString(reader.result);
			setTimeout(() => {
				this.formSubmitting = false;
			}, 100);
			this.navigateByDoc(this.app.doc);
		};
	};

	loadError = (file, data) => {
		this.app.doc = null;
		this.error = data;
		this.formSubmitting = false;
	};

	private navigateByDoc = (doc: Document) => {
		this.app.router.navigate('blocks.xml');
	};

}
