const m = require('mithril')
const bindAnimations = require('../utils/animations.js')
const Config = require('electron-config')

const appState = require('../data/appstate')
const {getTrackStreamInfo, downloadFile} = require('../api/scapi')

const fs = require('fs')
const path = require('path')

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
    if (appState.selectedDestination == '' || appState.selectedPlaylist == '' || appState.tracksToDownload.length == 0) {
        self.error = 'Vous n\'avez pas sélectionné toutes les informations nécessaires. SVP retourner les choisir avant de continuer.'
        self.loaded = true
    } else {
        self.loaded = true
        self.trackcache = conf.get(appState.selectedPlaylist) || []
        self.songInfo.songtotal = appState.tracksToDownload.length
        appState.tracksToDownload.reduce((pms, track, idx) => {
            return pms.then(() => {
                self.songInfo.songno = idx + 1
                self.songInfo.artist = track.artist
                self.songInfo.album = track.album
                self.songInfo.title = track.title
                m.redraw()
                return downloadFile(track.artwork, self.doProgress).then((artw) => {
                    const buf = new Buffer(artw)
                    fs.writeFileSync(path.join(path.normalize(appState.selectedDestination), `art${idx}.jpg`), buf)
                })
            })
        }, Promise.resolve()).then((data) => {
            console.log(data)
        }).catch((err) => {
            console.error(err)
        })
    }

    self.doProgress = (progress) => {
        self.currentProgress = progress
        m.redraw()
    }
    
    self.goBack = (e) => {
        e.preventDefault()
        Download.changePage('/destination', 'previous')
    }

    self.doContinue = (e) => {
        e.preventDefault()
        
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
            m('div.progress.mt10', m('div.progress-bar.progress-bar-striped.active', {style: `width: ${self.currentProgress}%`})),
            m('div.btn-group.btn-group-justified.mt10', [
                m('div.btn-group',  m('button.btn.btn-default', {onclick: self.goBack}, "< Retour")),
                m('div.btn-group', m('button.btn.btn-primary', {onclick: self.doContinue}, "Continuer >"))
            ])
        ]) : m('div.text-center', [
            m('h3.pulsing', "Chargement...")
        ])
    ]))
}

module.exports.Download = Download