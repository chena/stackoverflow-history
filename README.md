# Stackoverflow History

Chrome extension that extracts page visits to Stackoverflow and analyzes those results. It uses the following technologies: 

* [AngularJS](https://angularjs.org/) for the single page app.
* [Chrome History API](https://developer.chrome.com/extensions/history) to access browser history.
* [Stack Exchange API](http://api.stackexchange.com/docs) to extract page data for analysis, such as Stackoverflow question tags. 
* [D3](http://d3js.org/) for the data visualization, using the cloud layout.

## Usage (for development)
1. In order to use the StackExchange API, you need to first register an app on [stackapps](http://stackapps.com/apps/oauth/register). You can fill in the `Application Website` once you load the extension in the browser. The `domain` will be the ID of the unpacked extension.
2. Modify `key.json` with your own app key.
3. Go to your Chrome's extensions page in your browser `chrome://extensions/`
4. Drag and drop the project directory `stackoverflow-history` into the page; or alternatively, click on "Load unpack extension..." to add it.
5. Make sure that you have the correct information on your regiestered app from Step 1, then reload the extension.
6. Click on the Stackoverflow icon in the top right corner of the browser window, which should open up a new tab.

## Demo
![history](https://raw.githubusercontent.com/chena/stackoverflow-history/master/history.png)
![cloud](https://raw.githubusercontent.com/chena/stackoverflow-history/master/cloud.png)




