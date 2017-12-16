import {Router, RouterConfiguration} from 'aurelia-router';

export class App {

	public router: Router;

	public originalDoc: Document;

	public doc: Document;

	public view;

	configureRouter(config: RouterConfiguration, router: Router) {
		config.title = '7 Days To Die server XML configs editor';
		config.map([
			{route: '', moduleId: 'open-file', title: 'Open File'},
			{route: 'blocks.xml', moduleId: 'blocks', name: 'blocks'}
		]);

		this.router = router;
	}

}
