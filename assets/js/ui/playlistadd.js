const m = require('mithril')
const bindAnimations = require('../utils/animations.js')
const Config = require('electron-config')

const {getUserPlaylists} = require('../api/scapi')

const conf = new Config()

const PlaylistAdd = {}

PlaylistAdd.oninit = function (vnode) {
    let self = this
    bindAnimations(PlaylistAdd, vnode.attrs.direction)
    self.loaded = false
    self.playlists = conf.get('playlists') || []
    self.loaded = true
    self.error = ''
    self.userurl = conf.get('scurl') || ''

    self.cancelAdd = (e) => {
        e.preventDefault()
        PlaylistAdd.changePage('/playlists', 'previous')
    }

    self.doAdd = (e) => {
        e.preventDefault()
        self.error = ''

        if (self.userurl == '') {
            self.error = 'Vous devez inscrire l\'url de votre utilisateur SoundCloud!'
        } else {
            self.loaded = false
            getUserPlaylists(self.userurl).then((data) => {
                conf.set('scurl', self.userurl)
                const curIds = self.playlists.map((pl) => pl.id)
                data.filter((pl) => {
                    return curIds.indexOf(pl.id) == -1
                }).map((pl) => {
                    self.playlists.push({name: pl.title, id: pl.id})
                })
                conf.set('playlists', self.playlists)
                PlaylistAdd.changePage('/playlists', 'previous')
            }).catch((err) => {
                console.error(err)
                self.loaded = true
                m.redraw()
            })
        }
    }
}

PlaylistAdd.view = function () {
    let self = this
    return m('div.contentpage', m('div.jumbotron.pageframe', [
        self.loaded ? 
        m('div.text-center', [
            m('div.lead', 'Ajouter les listes de mon compte SoundCloud.'),
            self.error ? m('div.alert.alert-danger', self.error) : '',
            m('form', [
                m('div.form-group', [
                    m('label', 'Url de l\'utilisateur (ex.: https://soundcloud.com/monutilisateur/)'),
                    m('input.form-control', {onchange: m.withAttr('value', (val) => self.userurl = val), value: self.userurl})
                ]),
                m('div.btn-group.btn-group-justified.mt10', [
                    m('div.btn-group',  m('button.btn.btn-default', {onclick: self.cancelAdd}, "Annuler")),
                    m('div.btn-group', m('button.btn.btn-primary', {onclick: self.doAdd}, "Ajouter mes listes"))
                ])
            ])
        ]) : m('div.text-center', [
            m('h3.pulsing', "Chargement...")
        ])
    ]))
}

module.exports.PlaylistAdd = PlaylistAdd