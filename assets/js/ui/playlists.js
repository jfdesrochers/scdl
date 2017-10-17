const m = require('mithril')
const bindAnimations = require('../utils/animations.js')
const Config = require('electron-config')

const appState = require('../data/appstate')

const conf = new Config()

const Playlists = {}

Playlists.oninit = function (vnode) {
    let self = this
    bindAnimations(Playlists, vnode.attrs.direction)
    self.loaded = false
    self.playlists = conf.get('playlists', [])
    self.loaded = true
    self.modify = false
    
    self.toggleModify = (e) => {
        e.preventDefault()
        self.modify = !self.modify
    }
    self.addPlaylistItem = (e) => {
        e.preventDefault()
        Playlists.changePage('/playlistadd', 'next')
    }
    self.goDownload = (id) => {
        return (e) => {
            e.preventDefault()
            appState.selectedPlaylist = id
            Playlists.changePage('/destination', 'next')
        }
    }
    self.goEmpty = (id) => {
        return (e) => {
            e.preventDefault()
            e.stopPropagation()
            conf.delete(String(id))
            alert(`Cache vidé pour ${id}.`)
        }
    }
    self.goRemove = (id) => {
        return (e) => {
            e.preventDefault()
            e.stopPropagation()
            self.playlists = self.playlists.filter(item => item.id != id)
            conf.set('playlists', self.playlists)
            conf.delete(String(id))
        }
    }
}

Playlists.view = function () {
    let self = this
    return m('div.contentpage', m('div.jumbotron.pageframe', [
        self.loaded ? 
        m('div.text-center', [
            m('div.lead', 'Choisissez une liste de lecture pour continuer.'),
            self.playlists.length > 0 ? m('div.list-group', [
                self.playlists.map((item) => {
                    return m('a[href="#"].list-group-item.clearfix', {onclick: self.goDownload(item.id)}, [
                        `${item.name} `,
                        m('span.muted', `(${item.id})`), self.modify ? [
                            m('br'),
                            m('span.btn.btn-warning.btn-xs.mr5', {onclick: self.goEmpty(item.id)}, 'Vider le cache'),
                            m('span.btn.btn-danger.btn-xs', {onclick: self.goRemove(item.id)}, 'Supprimer')
                        ] : ''
                    ])
                })
            ]) : "Vous n'avez pas encore ajouté de liste de lecture!",
            m('div.btn-group.btn-group-justified.mt10', [
                self.playlists.length > 0 ? m('div.btn-group',  m('button.btn.btn-default', {onclick: self.toggleModify}, self.modify ? "Terminé" : "Modifier...")) : '',
                m('div.btn-group', m('button.btn.btn-primary', {onclick: self.addPlaylistItem}, "Ajouter mes listes"))
            ])
        ]) : m('div.text-center', [
            m('h3.pulsing', "Chargement...")
        ])
    ]))
}

module.exports.Playlists = Playlists