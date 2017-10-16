const m = require('mithril')
const bindAnimations = require('../utils/animations.js')
const Config = require('electron-config')

const appState = require('../data/appstate')
const {getPlaylistInfo} = require('../api/scapi')

const conf = new Config()

const PreDownload = {}

PreDownload.oninit = function (vnode) {
    let self = this
    bindAnimations(PreDownload, vnode.attrs.direction)
    self.loaded = false
    self.trackcache = []
    self.tracksToDownload = []
    self.error = ''
    if (appState.selectedDestination == '' || appState.selectedPlaylist == '') {
        self.error = 'Vous n\'avez pas sélectionné toutes les informations nécessaires. SVP retourner les choisir avant de continuer.'
        self.loaded = true
    } else {
        self.trackcache = conf.get(appState.selectedPlaylist) || []
        getPlaylistInfo(appState.selectedPlaylist).then((data) => {
            self.tracksToDownload = data.tracks.filter((trk) => {
                return !(trk.id in self.trackcache)
            }).map((trk) => {
                return {
                    id: trk.id,
                    artist: trk.user.username || '',
                    title: trk.title || '', 
                    genre: trk.genre || '',
                    artwork: trk.artwork_url || trk.user.avatar_url || '',
                    album: data.title
                }
            })
            console.log('Tracks to download:', self.tracksToDownload)
            self.loaded = true
        }).catch((err) => {
            console.error(err)
            self.loaded = true
        })
    }
    
    self.goBack = (e) => {
        e.preventDefault()
        PreDownload.changePage('/destination', 'previous')
    }

    self.doContinue = (e) => {
        e.preventDefault()
        appState.tracksToDownload = [].concat(self.tracksToDownload)
        PreDownload.changePage('/download', 'next')
    }
}

PreDownload.view = function () {
    let self = this
    return m('div.contentpage', m('div.jumbotron.pageframe', [
        self.loaded ? 
        m('div.text-center', [
            m('div.lead', 'Voici les informations du téléchargement.'),
            self.error ? m('div.alert.alert-danger', self.error) : '',
            m('ul.text-left', [
                m('li', `Identifiant de la liste: ${appState.selectedPlaylist}`),
                m('li', `Emplacement de destination: ${appState.selectedDestination}`),
                m('li', `Nombre de chansons à télécharger: ${self.tracksToDownload.length}`)
            ]),
            m('div.btn-group.btn-group-justified.mt10', [
                m('div.btn-group',  m('button.btn.btn-default', {onclick: self.goBack}, "< Retour")),
                m('div.btn-group', m('button.btn.btn-primary', {onclick: self.doContinue}, "Continuer >"))
            ])
        ]) : m('div.text-center', [
            m('h3.pulsing', "Chargement...")
        ])
    ]))
}

module.exports.PreDownload = PreDownload