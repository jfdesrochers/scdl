const m = require('mithril')
const bindAnimations = require('../utils/animations.js')
const Config = require('electron-config')
const {remote} = require('electron')

const appState = require('../data/appstate')

const conf = new Config()

const Destination = {}

Destination.oninit = function (vnode) {
    let self = this
    bindAnimations(Destination, vnode.attrs.direction)
    self.loaded = false
    self.currentDestination = conf.get('destination', '')
    self.loaded = true

    self.goBack = (e) => {
        e.preventDefault()
        Destination.changePage('/playlists', 'previous')
    }

    self.chooseDestination = (e) => {
        e.preventDefault()
        self.currentDestination = remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
            properties: ['openDirectory']
        }) || self.currentDestination
        if (Array.isArray(self.currentDestination)) {
            self.currentDestination = self.currentDestination[0]
        }
        if (self.currentDestination.length > 0) {
            conf.set('destination', self.currentDestination)
        }
    }

    self.doContinue = (e) => {
        e.preventDefault()
        appState.selectedDestination = self.currentDestination
        Destination.changePage('/predownload', 'next')
    }
}

Destination.view = function () {
    let self = this
    return m('div.contentpage', m('div.jumbotron.pageframe', [
        self.loaded ? 
        m('div.text-center', [
            m('div.lead', 'Choisissez un emplacement de destination.'),
            m('form', [
                m('div.form-group', [
                    m('label', 'Destination du téléchargement'),
                    m('input.form-control', {onchange: m.withAttr('value', (val) => self.currentDestination = val), value: self.currentDestination, readonly: true})
                ]),
                m('div.btn-group.btn-group-justified.mt10', [
                    m('div.btn-group', m('button.btn.btn-info', {onclick: self.chooseDestination}, "Choisir une destination..."))
                ])
            ]),
            m('div.btn-group.btn-group-justified.mt10', [
                m('div.btn-group',  m('button.btn.btn-default', {onclick: self.goBack}, "< Retour")),
                self.currentDestination.length > 0 ? m('div.btn-group', m('button.btn.btn-primary', {onclick: self.doContinue}, "Continuer >")) : ''
            ])
        ]) : m('div.text-center', [
            m('h3.pulsing', "Chargement...")
        ])
    ]))
}

module.exports.Destination = Destination