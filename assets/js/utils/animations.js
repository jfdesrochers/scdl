const m = require('mithril')

/**
 * 
 * @param {object} mObj Mithril object to bind the animations to.
 * @param {string} direction Direction of the animation (left or right).
 * @param {object} lcFunc Optional. You can provide LifeCycle functions for oncreate and/or onbeforeremove to be called after the animations are bound.
 */

const bindAnimations = function (mObj, direction, lcFunc) {
    lcFunc = lcFunc || {}

    mObj._direction = direction

    mObj.oncreate = function (vnode) {
        vnode.dom.classList.add(mObj._direction)
        if ('oncreate' in lcFunc) {
            lcFunc.oncreate(vnode)
        }
    }

    mObj.onbeforeremove = function (vnode) {
        if ('onbeforeremove' in lcFunc) {
            return Promise.resolve(lcFunc.onbeforeremove(vnode))
            .then(() => {
                vnode.dom.classList.remove('next', 'previous')
                vnode.dom.classList.add('close' + mObj._direction)
                return new Promise((resolve) => {
                    setTimeout(resolve, 500)
                })
            })
        }
        vnode.dom.classList.remove('next', 'previous')
        vnode.dom.classList.add('close' + mObj._direction)
        return new Promise((resolve) => {
            setTimeout(resolve, 500)
        })
    }

    mObj.changePage = function (routeName, new_direction) {
        mObj._direction = new_direction
        m.route.set(routeName + '/' + new_direction)
    }
}

module.exports = bindAnimations