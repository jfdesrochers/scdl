const m = require('mithril')
const bindAnimations = require('../utils/animations.js')
const Config = require('electron-config')
const NodeID3 = require('node-id3')

const appState = require('../data/appstate')
const {getTrackStreamInfo, downloadFile} = require('../api/scapi')

const fs = require('fs')
const path = require('path')
const sanitize = require('sanitize-filename')

const conf = new Config()

const Download = {}

Download.oninit = function (vnode) {
    let self = this
    bindAnimations(Download, vnode.attrs.direction)
    self.loaded = false
    self.trackcache = []
    self.error = ''
    self.songInfo = {
        artist: '',
        album: '',
        title: '',
        songno: 0,
        songtotal: 0
    }
    self.currentProgress = 0
    self.currentStatus = ''
    self.allDone = false
    self.cancelling = false
    self.setStatus = (status) => {
        self.currentStatus = status
        m.redraw()
    }
    if (appState.selectedDestination == '' || appState.selectedPlaylist == '' || appState.tracksToDownload.length == 0) {
        self.error = 'Vous n\'avez pas sélectionné toutes les informations nécessaires. SVP retourner les choisir avant de continuer.'
        self.loaded = true
    } else {
        self.loaded = true
        self.trackcache = conf.get(String(appState.selectedPlaylist), [])
        self.songInfo.songtotal = appState.tracksToDownload.length
        appState.tracksToDownload.reduce((pms, track, idx) => {
            return pms.then(() => {
                if (self.cancelling) throw "Annulé par l'utilisateur."
                self.songInfo.songno = idx + 1
                self.songInfo.artist = track.artist
                self.songInfo.album = track.album
                self.songInfo.title = track.title
                self.setStatus('Téléchargement de la pochette d\'album...')
                m.redraw()
                let artbuf = null
                let artpms = null
                if (track.artwork) {
                    artpms = downloadFile(track.artwork, self.doProgress).then((artw) => {
                        artbuf = new Buffer(artw)
                    })
                } else {
                    artpms = Promise.resolve()
                }
                return artpms.then(() => {
                    if (self.cancelling) throw "Annulé par l'utilisateur."
                    self.setStatus('Téléchargement des informations de la chanson...')
                    return getTrackStreamInfo(track.id)
                }).then((trackdata) => {
                    if (self.cancelling) throw "Annulé par l'utilisateur."
                    self.setStatus('Téléchargement de la chanson...')
                    return downloadFile(trackdata.http_mp3_128_url, self.doProgress)
                }).then((song) => {
                    let songbuf = new Buffer(song)
                    self.setStatus('Écriture des métadonnées de la chanson...')
                    let tags = {
                        title: track.title,
                        artist: track.artist,
                        album: track.album,
                        image: artbuf
                    }
                    songbuf = NodeID3.write(tags, songbuf)
                    self.setStatus('Sauvegarde sur le disque...')
                    fs.writeFileSync(path.join(path.normalize(appState.selectedDestination), sanitize(`${track.title}.mp3`)), songbuf)
                    self.trackcache.push(track.id)
                    conf.set(String(appState.selectedPlaylist), self.trackcache)                    
                })
            })
        }, Promise.resolve()).then(() => {
            self.currentProgress = 100
            self.allDone = true
            self.setStatus('Terminé.')
        }).catch((err) => {
            console.error(err)
            self.error = `Une erreur est survenue (${err}).`
            self.currentProgress = 100
            self.setStatus('Une erreur est survenue.')
        })
    }

    self.doProgress = (progress) => {
        self.currentProgress = progress
        m.redraw()
    }
    
    self.goBack = (e) => {
        e.preventDefault()
        Download.changePage('/playlists', 'previous')
    }

    self.requestCancel = (e) => {
        e.preventDefault()
        self.cancelling = true
        m.redraw()
    }
}

Download.view = function () {
    let self = this
    return m('div.contentpage', m('div.jumbotron.pageframe', [
        self.loaded ? 
        m('div.text-center', [
            m('div.lead', 'Téléchargement en cours...'),
            self.error ? m('div.alert.alert-danger', self.error) : '',
            m('div.lead', `Chanson ${self.songInfo.songno} de ${self.songInfo.songtotal}`),
            m('div', self.songInfo.title),
            m('div', self.songInfo.artist),
            m('div', self.songInfo.album),
            m('div.mt10', self.currentStatus),
            m('div.progress', m(`div.progress-bar${self.allDone ? '.progress-bar-success' : self.error ? '.progress-bar-danger' : '.progress-bar-striped.active'}`, {style: `width: ${self.currentProgress}%`})),
            m('div.btn-group.btn-group-justified.mt10', [
                self.error ? m('div.btn-group', m('button.btn.btn-danger', {onclick: self.goBack}, "< Retour")) :
                self.cancelling ? m('div.btn-group', m('button.btn.btn-danger', {onclick: self.requestCancel}, "Annulation en cours...")) :
                self.allDone ? m('div.btn-group', m('button.btn.btn-success', {onclick: self.goBack}, "< Retour")) :
                m('div.btn-group', m('button.btn.btn-danger', {onclick: self.requestCancel}, "Annuler"))
            ])
        ]) : m('div.text-center', [
            m('h3.pulsing', "Chargement...")
        ])
    ]))
}

module.exports.Download = Download