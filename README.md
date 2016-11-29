# TIES532 Henri Haverinen

"RESTful web services" task for course TIES532. This project delivers NodeJS server with very simple UI for
synchronizing users files from dropbox service to sendspace.

Table of contents
---
* [How-to](#howto)
* [Technical details](#tech-details)
    * [Used technologies](#technologies)
    * [Project structure](#structure)
    * [Details](#sub-details)
    
How-to<a name="howto"></a>
---
First you need to have NodeJS installed. I was using Node v6.9.1. You can download it [here](https://nodejs.org/en/).

Clone repository with git:
```
git clone https://github.com/hhaverinen/TIES532.git
```
Install dependencies:
```
npm install
```
Start the server
```
node index.js
```
Your server is up and running in port 3000! However before you can really use this program, you should make needed
 configurations to files under config/ .

Technical details<a name="tech-details"></a>
---
Here you can find some information about the implementation.

#### Used technologies<a name="technologies"></a>
Project is based on Javascript and NodeJS. It uses [ExpressJS](http://expressjs.com/) framework for more simply server
handling. [Pug](https://pugjs.org) is used for templating views.

For easier usage [Dropbox-sdk-js](https://github.com/dropbox/dropbox-sdk-js) is used to make interact with dropbox API.
However Dropbox authentication is made without sdk.

#### Project structure<a name="structure"></a>
- **config**: dropbox and sendspace configurations
- **public**: static files to be served by node, like client side javascript and css
- **SendSpaceClient**: Client for making requests to SendSpace API. Contains also some other useful functionalities.
- **utils**: modules containing general utilities functions
- **views**: views to be displayed

#### Details<a name="sub-details"></a>
Main entry point is naturally index.js, where all the routing, middleware functions and starting the server can be found.

When user is authenticated with Dropbox via oauth2 and supplied SendSpace username and password, file synchronization
can begin. Server calls [synchronizer.js](./synchronizer.js) which utilizes both APIs and handles the synchornization process.
After process is completed or failed, response message is given for user.

Since Javascript is single threaded, no actual threading is used for cranking up the performance. However many functions
are made asynchronously, for better performance. For example downloading files from Dropbox and uploading them to Sendspace
is made asynchronously. Also streams are used, so there should be less problems with memory.