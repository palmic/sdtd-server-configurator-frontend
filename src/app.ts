import {DOMParser, XMLSerializer} from 'xmldom';

export class App {

	public error = "";

	public content = "";

	public doc :Document;

	fileLoaded = (file, data) => {
		this.error = "";
		let reader = new FileReader();
		reader.readAsText(file);
		reader.onloadend = () => {
			this.doc = new DOMParser().parseFromString(reader.result);
			this.content = (new XMLSerializer()).serializeToString(this.doc);
		};
	};

	loadingInProgress = (file, data) => {

	};

	loadError = (file, data) => {
		this.content = "";
		this.doc = null;
		this.error = data;
	}

}
