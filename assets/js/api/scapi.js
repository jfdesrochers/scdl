const m = require('mithril')

const clientID = 'a3e059563d7fd3372b49b37f00a00bcf'

module.exports = {
    getPlaylistInfo: (plid) => {
        return m.request(`https://api.soundcloud.com/playlists/${plid}?client_id=${clientID}`)
    },
    getUserPlaylists: (userUrl) => {
        return m.request(`http://api.soundcloud.com/resolve?url=${userUrl}&client_id=${clientID}`).then((user) => {
            return m.request(`https://api.soundcloud.com/users/${user.id}/playlists?client_id=${clientID}`)
        })
    },
    getTrackStreamInfo: (trackID) => {
        return m.request(`https://api.soundcloud.com/i1/tracks/${trackID}/streams?format=json&client_id=${clientID}&app_version=1481041063`)
    },
    downloadFile: (dlUrl, onProgress) => {
        return m.request({
            method: 'GET',
            url: dlUrl, 
            deserialize: (value) => value,
            extract: (xhr) => {
                return xhr.response
            },
            config: (xhr) => {
                xhr.responseType = 'arraybuffer'
                xhr.addEventListener("progress", (e) => {
                    const progress = (e.loaded / e.total) * 100
                    onProgress(progress)
                })
            }
        })
    }
}