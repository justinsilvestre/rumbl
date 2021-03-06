import Player from "./player"
let Video = {
  init(socket, element) {
    if (!element) {
      return
    }
    let playerId = element.getAttribute("data-player-id")
    let videoId = element.getAttribute("data-id")
    socket.connect()
    Player.init(element.id, playerId, () => {
      this.onReady(videoId, socket)
    })
  },
  onReady(videoId, socket) {
    let msgContainer = document.getElementById("msg-container")
    let msgInput = document.getElementById("msg-input")
    let postButton = document.getElementById("msg-submit")
    let vidChannel = socket.channel("videos:" + videoId)

    vidChannel.on('ping', (o) => console.log("PING!", o.count, o))

    postButton.addEventListener('click', e => {
      let payload = {body: msgInput.value, at: Player.getCurrentTime()}
      vidChannel.push('new_annotation', payload)
                .receive('error', e => console.log(e))
      msgInput.value = ''
    })

    vidChannel.on('new_annotation', resp => {
      vidChannel.params.last_seen_id = resp.id
      this.renderAnnotation(msgContainer, resp)
    })

    vidChannel.join()
      .receive('ok', (r) => {
        const { annotations } = r
        // annotations.forEach(ann => this.renderAnnotation(msgContainer, ann))
        const ids = annotations.map(a => a.id)
        if (ids.length)
          vidChannel.params.last_seen_id = Math.max(...ids)
        this.scheduleMessages(msgContainer, annotations)
      })
      .receive('error', reason => console.log('join failed :(', reason))
  },

  esc(str) {
    let div = document.createElement('div')
    div.appendChild(document.createTextNode(str))
    return div.innerHTML
  },

  renderAnnotation(msgContainer, { user, body, at, id }) {
    let template = document.createElement('div')

    template.innerHTML = `
    <a href="#" data-seek="${this.esc(at)}">
    ${id} [${this.formatTime(at)}]
      <b>${this.esc(user.username)}</b>: ${this.esc(body)}
    </a>
    `

    msgContainer.appendChild(template)
    msgContainer.scrollTop = msgContainer.scrollHeight
  },

  scheduleMessages(msgContainer, annotations) {
    setTimeout(() => {
      let ctime = Player.getCurrentTime()
      let remaining = this.renderAtTime(annotations, ctime, msgContainer)
      this.scheduleMessages(msgContainer, remaining)
    })
  },

  renderAtTime(annotations, seconds, msgContainer) {
    return annotations.filter((ann) => {
      if (ann.at > seconds) {
        return true
      } else {
        this.renderAnnotation(msgContainer, ann)
        return false
      }
    })
  },

  formatTime(at) {
    let date = new Date(null)
    date.setSeconds(at / 1000)
    return date.toISOString().substr(14, 5)
  }
}

export default Video
