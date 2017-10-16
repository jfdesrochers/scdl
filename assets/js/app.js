const m = require('mithril')
const {PlaylistAdd} = require('./assets/js/ui/playlistadd.js')
const {Playlists} = require('./assets/js/ui/playlists.js')
const {Destination} = require('./assets/js/ui/destination.js')
const {PreDownload} = require('./assets/js/ui/predownload.js')
const {Download} = require('./assets/js/ui/download.js')

m.route(document.getElementById("clcontents"), "/playlists/next", {
    "/playlists/:direction": Playlists,
    "/playlistadd/:direction": PlaylistAdd,
    "/destination/:direction": Destination,
    "/predownload/:direction": PreDownload,
    "/download/:direction": Download
})

m.route.set('/playlists/next')