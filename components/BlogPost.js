import EditorJS from '@editorjs/editorjs';
import RawTool from '@editorjs/raw';
import Header from '@editorjs/header';
import Delimiter from '@editorjs/delimiter';
import Embed from '@editorjs/embed';
import Table from '@editorjs/table'
import Quote from '@editorjs/quote'
import SimpleImage from '@editorjs/simple-image'
import NestedList from '@editorjs/nested-list';
import Checklist from '@editorjs/checklist';
import Paragraph from 'editorjs-paragraph-with-alignment'
import CodeTool from '@editorjs/code'
import Underline from '@editorjs/underline';
import DragDrop from 'editorjs-drag-drop';
import Undo from 'editorjs-undo';
import { File as File__ } from "../File"; // File object already exist in js and I need to use it...
import { ApplicationView } from '../ApplicationView';
import { CreateBlogPostRequest, GetBlogPostsByAuthorsRequest, SaveBlogPostRequest, BlogPost, DeleteBlogPostRequest, AddEmojiRequest, Emoji, AddCommentRequest, Comment, GetBlogPostsRequest } from 'globular-web-client/blog/blog_pb';
import { Application } from '../Application';
import { generatePeerToken, Model, getUrl } from '../Model';
import * as edjsHTML from 'editorjs-html'
import { Account } from '../Account';
import { v4 as uuidv4 } from "uuid";
import '@polymer/iron-icons/communication-icons'
import '@polymer/iron-icons/editor-icons'
import * as getUuidByString from 'uuid-by-string';
import { BlogPostInfo } from './Informations';
import { AppScrollEffectsBehavior } from '@polymer/app-layout/app-scroll-effects/app-scroll-effects-behavior';
import { Menu } from './Menu';
import { Carousel } from './Carousel'
import { ImageGallery } from './Gallery'
import "@polymer/paper-spinner/paper-spinner.js";
import { getAudioInfo, getVideoInfo } from './File';
import { SearchAudioCard, SearchVideoCard } from './Search';
import { randomUUID } from './utility';
import { playVideos } from './Video';
import { playAudio, playAudios } from './Audio';

const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 }
];

export function timeSince(date) {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    const interval = intervals.find(i => i.seconds < seconds);
    const count = Math.floor(seconds / interval.seconds);
    return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
}

// Get the image default size...
function getMeta(url, callback) {
    const img = new Image();
    img.addEventListener("load", () => {
        callback({ width: img.naturalWidth, height: img.naturalHeight });
    });
    img.src = url;
}

// generate html from json data
function jsonToHtml(data) {

    // So here I will get the plain html from the output json data.
    function filesParser(block) {
        let jsonStr = JSON.stringify(block.data.files)
        return `<globular-file-drop-zone files='${btoa(jsonStr)}'>  </globular-file-drop-zone>`;
    }

    const edjsParser = edjsHTML({ files: filesParser });

    let elements = edjsParser.parse(data);
    let html = ""
    elements.forEach(e => {
        html += e
    });

    var div = document.createElement('div');
    div.className = "blog-read-div"
    div.slot = "read-only-blog-content"
    div.innerHTML = html.trim();

    // Now I will set image height.
    let images = div.querySelectorAll("img")
    images.forEach(img => {
        getMeta(img.src, meta => {
            if (meta.width < div.offsetWidth && meta.height < div.offsetHeight) {
                img.style.width = meta.width + "px"
                img.style.height = meta.height + "px"
            }
        })

    })

    return div
}


/**
 * Here I will create the image from the data url.
 * @param {*} url 
 * @param {*} callback 
 */
function getImageFile(url, callback) {
    var image = new Image();
    image.crossOrigin = 'Anonymous';
    image.onload = function () {
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        canvas.height = this.naturalHeight;
        canvas.width = this.naturalWidth;
        context.drawImage(this, 0, 0);
        var dataURL = canvas.toDataURL('image/jpeg');
        let img = new Image()
        img.src = dataURL
        callback(img)
    };
    image.src = url;
}

/**
 * Create a thumbnail from an url. The url can from from img.src...
 * @param {*} src The image url
 * @param {*} w The width of the thumnail
 * @param {*} callback The callback to be call
 */
export function createThumbmail(src, w, callback) {
    getImageFile(src, (img) => {
        if (img.width > w) {
            var oc = document.createElement('canvas'), octx = oc.getContext('2d');
            oc.width = img.width;
            oc.height = img.height;
            octx.drawImage(img, 0, 0);
            if (img.width > img.height) {
                oc.height = (img.height / img.width) * w;
                oc.width = w;
            } else {
                oc.width = (img.width / img.height) * w;
                oc.height = w;
            }
            octx.drawImage(oc, 0, 0, oc.width, oc.height);
            octx.drawImage(img, 0, 0, oc.width, oc.height);
            callback(oc.toDataURL());
        } else {
            callback(img.src);
        }

    })
}

export function createThumbmailFromImage(img, w, callback) {
    createThumbmail(img.src, w, callback)
}

export function readBlogPost(domain, uuid, callback, errorCallback) {
    let globule = Model.getGlobule(domain)
    generatePeerToken(globule, token => {
        let rqst = new GetBlogPostsRequest
        rqst.setUuidsList([uuid])

        let stream = globule.blogService.getBlogPosts(rqst, { domain: Model.domain, application: Model.application, address: Model.address, token: token });
        let blogs = []

        stream.on("data", (rsp) => {
            blogs.push(rsp.getBlogPost())
        });

        stream.on("status", (status) => {
            if (status.code == 0) {
                callback(blogs[0])
            } else {
                callback([])
            }
        })
    }, errorCallback)
}

/**
 * Search Box
 */
export class BlogPostElement extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(blog, globule) {
        super()

        this.globule = globule
        if (!globule) {
            this.globule = Model.globular
        }

        this.blog = blog
        if (blog != undefined) {
            this.id = "_" + blog.getUuid()
        }

        // The close event listener.
        this.onclose = null

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>

            #container {
                display: flex;
                justify-content: center;
                margin-bottom: 10px;
                margin-top: 10px;
            }

            .blog-post-editor-div{
                display: flex;
                flex-direction: column;
                width: 800px;
            }

            .blog-post-title-div {
                display: flex;
                border-bottom: 1px solid var(--palette-action-disabled);
                padding: 4px;
                padding-left: 16px;
                align-items: center;
            }

            .blog-editor-title {
                flex-grow: 1;
                color: var(--palette-action-disabled);
                text-align: left;
                padding: 8px;
            }

            .blog-reader-title{
                flex-grow: 1;
                text-align: left;
                margin-left: 16px;
                padding: 8px;
            }
            
            .blog-options-panel{
                position: absolute;
                right: 50px;
                top: 40px;
                z-index: 100;
                background-color: var(--palette-background-paper);
            }

            .blog-options-panel .card-content{
                min-width: 400px;
                padding: 0px 10px 0px 10px;
                display: flex;
                flex-direction: column;

            }

            .blog-actions{
                display: flex;
                border-top: 1px solid var(--palette-action-disabled);
                align-items: center;
            }

            globular-string-list-setting {
                padding-left: 0px;
                padding-rigth: 0px;
            }

            .blog-post-reader-div{
                position: relative;
                width: 800px;
                text-align: center;
            }

            #close-btn{
                position: absolute;
                top: 0px;
                right: 0px;
                z-index: 100;
            }

            paper-card{
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
                font-size: 1rem;
                border-left: 1px solid var(--palette-divider); 
                border-right: 1px solid var(--palette-divider);
                border-top: 1px solid var(--palette-divider);
            }

            paper-radio-button {
                --paper-radio-button-checked-color: var(--palette-primary-main);
                --paper-radio-button-checked-ink-color: var(--palette-primary-main);
                --paper-radio-button-unchecked-color: var(--palette-action-disabled);
                --paper-radio-button-unchecked-ink-color: var(--palette-action-disabled);
                --paper-radio-button-label-color: var(--palette-action-disabled);
             }
             
             paper-radio-button[checked] {
                --paper-radio-button-label-color: var(--palette-text-accent);
             }
             
             @media (max-width: 500px) {
                #container {
                    width: calc(100vw - 20px);
                }
                .blog-post-editor-div, .blog-post-reader-div {
                    width: calc(100vw - 20px);
                    position: relative;
                }

                .blog-post-title-div{
                    width: 100%;
                    flex-direction: column;
                    align-items: flex-start;
                    padding: 0px;
                }

                .actions-div{
                    position: absolute;
                    top: 0px;
                    right: 0px;
                }

                .blog-actions{
                    flex-direction: column;
                }

                .blog-actions paper-radio-group{
                    align-self: flex-start;
                }

                .blog-actions div{
                    align-self: flex-end;
                }

                .blog-reader-title, .blog-read-div{
                    padding: 5px;
                    margin: 0px;
                    width: calc(100vw - 20px);
                }
             }
        </style>

        <div id="container">
            <paper-card class="blog-post-editor-div">
                <div class="blog-post-title-div">
                    <div style="display: flex; width: 32px; height: 32px; justify-content: center; align-items: center;position: relative;">
                        <iron-icon  id="collapse-btn"  icon="unfold-less" --iron-icon-fill-color:var(--palette-text-primary);"></iron-icon>
                        <paper-ripple class="circle" recenters=""></paper-ripple>
                    </div>
                    <span id="blog-editor-title" class="blog-editor-title">
                        ${Application.account.name}, express yourself
                    </span>

                    <div class="actions-div" style="display: flex;">
                        <paper-icon-button name="publish-blog" title="save the blog" icon="icons:save"></paper-icon-button>
                        <paper-icon-button name="blog-editor-delete-btn" title="delete blog" icon="icons:delete" ></paper-icon-button>
                        <paper-icon-button id="exit-editor-btn" title="exit edit mode" icon="icons:exit-to-app"></paper-icon-button>
                        <paper-icon-button icon="icons:more-vert" title="more options" id="blog-editor-menu-btn"></paper-icon-button>
                        <paper-icon-button id="close-editor-btn" title="exit" icon="icons:close"></paper-icon-button>
                    </div>
                </div>
                <iron-collapse opened = "[[opened]]" id="collapse-panel" style="display: flex; flex-direction: column;">
                    <paper-card id="blog-editor-options-panel" class="blog-options-panel" style="display: none;">
                        <div style="display: flex; flex-direction: column; margin: 5px;">
                            <globular-image-selector label="cover" url=""> </globular-image-selector>
                        </div>
                        <div class="card-content" style="background-color: transparent;">
                            <paper-input id="blog-title-input" label="title"></paper-input>
                            <paper-input id="blog-subtitle-input" label="subtitle"></paper-input>
                            <globular-string-list-setting id="keywords-list" name="keywords" description="keywords will be use by the search engine to retreive your blog."></globular-string-list-setting>
                        </div>
                        <div style="display: flex;">
                            <div class="blog-actions" style="background-color: transparent; flex-grow: 1;">
                                <paper-radio-group selected="draft" style="flex-grow: 1;  text-align: left; font-size: 1rem;">
                                    <paper-radio-button name="draft">draft</paper-radio-button>
                                    <paper-radio-button name="published">published</paper-radio-button>
                                    <paper-radio-button name="archived">archived</paper-radio-button>
                                </paper-radio-group>
                            </div>
                        </div>
                    </paper-card>

                    <slot  id="edit-blog-content" name="edit-blog-content"></slot>
                </iron-collapse>

            </paper-card>

            <paper-card class="blog-post-reader-div">
                <div id="title" class="blog-post-title-div">
                    <div style="display: flex; flex-direction: column; padding-left: 5px;">
                        <div>
                            <img id="blog-reader-author-blog-post" style="width: 32px; height: 32px; border-radius: 16px; display:none;"></img>
                            <iron-icon id="blog-reader-author-icon"  icon="account-circle" style="width: 34px; height: 34px; --iron-icon-fill-color:var(--palette-action-disabled); display: block;"></iron-icon>
                        </div>
                        <span  id="blog-reader-author-id"></span>
                    </div>
                    <h2 class="blog-reader-title"></h2>
                    <div class="actions-div" style="display: flex;">
                        <paper-icon-button id="blog-reader-edit-btn" icon="editor:mode-edit"></paper-icon-button>
                        <paper-icon-button id="close-reader-btn" icon="icons:close"></paper-icon-button>
                    </div>
                </div>

                <slot id="read-only-blog-content" name="read-only-blog-content"></slot>
                <slot name="blog-comments"></slot>
                
            </paper-card>
        </div>
        `

        // The comments container...
        this.blogComments = new BlogComments(blog, null, globule)
        this.blogComments.slot = "blog-comments"
        this.appendChild(this.blogComments)

        if (blog != null) {
            if (blog.getStatus() == 0) {
                this.shadowRoot.querySelector("paper-radio-group").selected = "draft"
            } else if (blog.getStatus() == 1) {
                this.shadowRoot.querySelector("paper-radio-group").selected = "published"
            } else if (blog.getStatus() == 2) {
                this.shadowRoot.querySelector("paper-radio-group").selected = "archived"
            }

            if (blog.getThumbnail().length > 0) {
                this.shadowRoot.querySelector("globular-image-selector").setImageUrl(blog.getThumbnail())
            } else {
                console.log("-------------> no image was set for thumbnail...")
            }

            this.shadowRoot.querySelector("globular-image-selector").ondelete = () => {
                blog.setThumbnail("")
            }

            this.shadowRoot.querySelector("globular-image-selector").onselectimage = (dataUrl) => {
                this.blog.setThumbnail(dataUrl)
            }
        }

        this.shadowRoot.querySelector("#close-reader-btn").onclick = () => {
            if (this.onclose != undefined) {
                this.onclose()
            }
        }

        this.shadowRoot.querySelector("#close-editor-btn").onclick = () => {
            if (this.onclose != undefined) {
                this.onclose()
            }
        }

        this.shadowRoot.querySelector("#exit-editor-btn").onclick = () => {
            this.read(() => {
                ApplicationView.displayMessage("exit edit mode", 3000)
            })
        }


        this.collapse_btn = this.shadowRoot.querySelector("#collapse-btn")
        this.collapse_panel = this.shadowRoot.querySelector("#collapse-panel")
        this.collapse_btn.onclick = () => {
            if (!this.collapse_panel.opened) {
                this.collapse_btn.icon = "unfold-more"
            } else {
                this.collapse_btn.icon = "unfold-less"
            }
            this.collapse_panel.toggle();
        }

        // publish the blog...
        let publishBtns = this.shadowRoot.querySelectorAll(`[name="publish-blog"]`)
        for (var i = 0; i < publishBtns.length; i++) {
            publishBtns[i].onclick = () => {
                this.publish()
            }
        }

        // Delete the blog...
        let deleteBtns = this.shadowRoot.querySelectorAll(`[name="blog-editor-delete-btn"]`)
        for (var i = 0; i < deleteBtns.length; i++) {
            deleteBtns[i].onclick = () => {
                let toast = ApplicationView.displayMessage(
                    `
                <style>
                
                #yes-no-blog-post-delete-box{
                    display: flex;
                    flex-direction: column;
                }

                #yes-no-blog-post-delete-box globular-blog-post-card{
                    padding-bottom: 10px;
                }

                #yes-no-blog-post-delete-box div{
                    display: flex;
                    padding-bottom: 10px;
                }

                </style>
                <div id="yes-no-blog-post-delete-box">
                <div>Your about to delete blog post</div>
                <img style="max-height: 256px; object-fit: contain; width: 100%;" src="${this.blog.getThumbnail()}"></img>
                <span style="font-size: 1.1rem;">${this.blog.getTitle()}</span>
                <div>Is it what you want to do? </div>
                <div style="justify-content: flex-end;">
                    <paper-button raised id="yes-delete-blog-post">Yes</paper-button>
                    <paper-button raised id="no-delete-blog-post">No</paper-button>
                </div>
                </div>
                `,
                    60 * 1000 // 60 sec...
                );

                let yesBtn = document.querySelector("#yes-delete-blog-post")
                let noBtn = document.querySelector("#no-delete-blog-post")

                // On yes
                yesBtn.onclick = () => {

                    let rqst = new DeleteBlogPostRequest
                    rqst.setUuid(this.blog.getUuid())
                    let globule = this.globule
                    rqst.setIndexpath(globule.config.DataPath + "/search/blogPosts")

                    // Delete the blog...
                    generatePeerToken(globule, token => {
                        globule.blogService.deleteBlogPost(rqst, { domain: Model.domain, application: Model.application, address: Model.address, token: token })
                            .then(rsp => {
                                Model.getGlobule(this.blog.getDomain()).eventHub.publish(this.blog.getUuid() + "_blog_delete_event", {}, false)
                                Model.eventHub.publish("_blog_delete_event_", this.blog.getUuid(), true)

                                ApplicationView.displayMessage(
                                    `<div style="display: flex; flex-direction: column;">
                                    <span style="font-size: 1.1rem;">${this.blog.getTitle()}</span>
                                    <span>was deleted...</span>
                                 </div>`,
                                    3000
                                );
                            })
                            .catch(e => ApplicationView.displayMessage(e, 3000))
                    }, err => ApplicationView.displayMessage(err, 3000))

                    toast.dismiss();
                }

                noBtn.onclick = () => {
                    toast.dismiss();
                }
            }
        }

        // do not close the panel...
        this.shadowRoot.querySelector("#blog-editor-options-panel").onclick = (evt) => {
            evt.stopPropagation()
        }


        // Display the option panel.
        this.shadowRoot.querySelector("#blog-editor-menu-btn").onclick = (evt) => {
            evt.stopPropagation()

            let optionPanel = this.shadowRoot.querySelector("#blog-editor-options-panel")
            if (optionPanel.style.display == "") {
                optionPanel.style.display = "none";
            } else {
                optionPanel.style.display = "";
                optionPanel.style.top = optionPanel.parentNode.offsetHeigt / 2 + "px"
            }

            if (this.titleInput.value) {
                if (this.titleInput.value.length > 0) {
                    this.titleSpan.innerHTML = this.titleInput.value;
                    this.titleSpan.style.color = "var(--palette-text-primary)"
                } else {
                    this.titleSpan.innerHTML = ` ${Application.account.name}, express yourself`
                    this.titleSpan.style.color = "var(--palette-action-disabled)"
                }
            } else {
                this.titleSpan.innerHTML = ` ${Application.account.name}, express yourself`
                this.titleSpan.style.color = "var(--palette-action-disabled)"
            }
        }

        this.shadowRoot.querySelector("#container").onclick = () => {
            let optionPanel = this.shadowRoot.querySelector("#blog-editor-options-panel")
            optionPanel.style.display = "none";
        }



        // The editor values.
        this.titleSpan = this.shadowRoot.querySelector(".blog-reader-title")
        this.titleInput = this.shadowRoot.querySelector("#blog-title-input")
        this.subtitleInput = this.shadowRoot.querySelector("#blog-subtitle-input")
        this.keywordsEditList = this.shadowRoot.querySelector("#keywords-list")

        // switch to edit mode...
        this.shadowRoot.querySelector("#blog-reader-edit-btn").onclick = () => {
            this.edit(() => {
                this.setAttribute("editable", "true")
                ApplicationView.displayMessage("you'r in edit mode, click save to exit...", 3000)
            })
        }

        // set the blog.
        if (blog != undefined) {
            this.setBlog(blog)
        }
    }

    // Connection callback
    connectedCallback() {
        // If the blog editor is set to true...
        if (this.getAttribute("editable") != undefined) {
            if (this.getAttribute("editable") == "true") {
                this.edit(() => {

                })
            }
        }
    }

    // Set the blog...
    setBlog(blog) {
        this.blog = blog;

        if (this.blog.getThumbnail().length > 0) {
            this.shadowRoot.querySelector("globular-image-selector").setImageUrl(blog.getThumbnail())
        } else {
            console.log("no image was set to blog.")
        }


        this.shadowRoot.querySelector("globular-image-selector").ondelete = () => {
            blog.setThumbnail("")
        }

        this.shadowRoot.querySelector("globular-image-selector").onselectimage = (dataUrl) => {
            this.blog.setThumbnail(dataUrl)
        }


        this.blogComments.setBlog(blog)

        if (this.blog.getAuthor() != Application.account.getId() + "@" + Application.account.getDomain()) {
            let editBtn = this.shadowRoot.querySelector("#blog-reader-edit-btn")
            editBtn.parentNode.removeChild(editBtn)
        }

        if (this.updateListener == undefined) {

            Model.getGlobule(this.blog.getDomain()).eventHub.subscribe(this.blog.getUuid() + "_blog_updated_event", uuid => this.updateListener = uuid, evt => {
                readBlogPost(this.blog.getDomain(), this.blog.getUuid(), b => {
                    this.blog = b
                    let isEditable = this.getAttribute("editable")
                    if (isEditable == undefined) {
                        isEditable = false
                    } else {
                        if (this.getAttribute("editable") == "true") {
                            isEditable = true
                        } else {
                            isEditable = false
                        }
                    }

                    if (isEditable) {
                        this.edit(() => {
                            this.titleSpan.innerHTML = this.blog.getTitle()
                            this.titleInput.value = this.blog.getTitle()
                            this.subtitleInput.value = this.blog.getSubtitle()
                            this.keywordsEditList.setValues(this.blog.getKeywordsList())
                        })
                    } else {
                        this.read(() => {
                            // set back values.
                            this.titleSpan.innerHTML = this.blog.getTitle()
                            this.titleInput.value = this.blog.getTitle()
                            this.subtitleInput.value = this.blog.getSubtitle()
                            this.keywordsEditList.setValues(this.blog.getKeywordsList())
                        })
                    }
                }, err => ApplicationView.displayMessage(err, 3000))



            }, false, this)
        }

        if (this.deleteListener == undefined) {
            Model.getGlobule(this.blog.getDomain()).eventHub.subscribe(this.blog.getUuid() + "_blog_delete_event", uuid => this.deleteListener = uuid,
                evt => {
                    // simplity remove it from it parent...
                    if (this.parentNode)
                        this.parentNode.removeChild(this)

                    if (this.onclose) {
                        this.onclose()
                    }
                }, false, this)
        }

        // Here I will set the blog various information...
        let authorIdSpan = this.shadowRoot.querySelector("#blog-reader-author-id")
        authorIdSpan.innerHTML = blog.getAuthor()

        Account.getAccount(blog.getAuthor(), a => {
            let img = this.shadowRoot.querySelector("#blog-reader-author-blog-post")
            let ico = this.shadowRoot.querySelector("#blog-reader-author-icon")
            if (a.profile_picture != undefined) {
                img.src = a.profile_picture
                img.style.display = "block"
                ico.style.display = "none"
            }

        }, e => {
            console.log(e)
        })

        this.shadowRoot.querySelector(".blog-reader-title").innerHTML = blog.getTitle()
        this.titleSpan.innerHTML = blog.getTitle()
        this.titleInput.value = blog.getTitle()
        this.subtitleInput.value = blog.getSubtitle()
        this.keywordsEditList.setValues(blog.getKeywordsList())
    }

    getThumbnail(width, callback) {
        // Take the image from the editor...
        let dataUrl = this.shadowRoot.querySelector("globular-image-selector").getImageUrl()
        if(dataUrl.endsWith("/")){
            dataUrl = "" // invalidate the given url...
        }

        if (dataUrl.length > 0) {
            callback(dataUrl)
            return
        }

        // Here I will create image
        let images = this.editorDiv.querySelectorAll("img")

        if (images.length > 0) {
            if (images.length == 1) {
                createThumbmailFromImage(images[0], width, dataUrl => {
                    if(dataUrl.endsWith("/")){
                        dataUrl = "" // invalidate the given url...
                    }
                    this.shadowRoot.querySelector("globular-image-selector").setImageUrl(dataUrl)
                    callback(dataUrl);
                })
            } else {
                this.shadowRoot.querySelector("globular-image-selector").createMosaic(images, callback)
            }
        } else {
            let galleries = this.editorDiv.querySelectorAll("globular-image-gallery")
            if (galleries.length > 0) {
                // take the first images...
                let images = galleries[0].getImages()
              
                if (images.length == 1) {
                    createThumbmailFromImage(images[0], width, dataUrl => {
                        if(dataUrl.endsWith("/")){
                            dataUrl = "" // invalidate the given url...
                        }
                        this.shadowRoot.querySelector("globular-image-selector").setImageUrl(dataUrl)
                        callback(dataUrl);
                        console.log(dataUrl)
                    })
                }else{
                    this.shadowRoot.querySelector("globular-image-selector").createMosaic(images, callback)
                }
                

            } else {
                let embeddedVideos = this.editorDiv.querySelectorAll("globular-embedded-videos")
                if (embeddedVideos.length > 0) {

                    // get all images from the first embeded video...
                    let images = embeddedVideos[0].getImages()
              
                    if (images.length == 1) {
                        createThumbmailFromImage(images[0], width, dataUrl => {
                            if(dataUrl.endsWith("/")){
                                dataUrl = "" // invalidate the given url...
                            }
                            this.shadowRoot.querySelector("globular-image-selector").setImageUrl(dataUrl)
                            callback(dataUrl);
                        })
                    } else {
                        this.shadowRoot.querySelector("globular-image-selector").createMosaic(images, callback)
                    }

                } else {
                    let embeddedAudios = this.editorDiv.querySelectorAll("globular-embedded-audios")
                    if (embeddedAudios.length > 0) {
                        let images = embeddedAudios[0].getImages()

                        // take the first images...
                        if (images.length == 1) {
                            createThumbmailFromImage(images[0], width, dataUrl => {
                                if(dataUrl.endsWith("/")){
                                    dataUrl = "" // invalidate the given url...
                                }
                                this.shadowRoot.querySelector("globular-image-selector").setImageUrl(dataUrl)
                                callback(dataUrl);
                            })
                        } else {
                            this.shadowRoot.querySelector("globular-image-selector").createMosaic(images, callback)
                        }
                    } else {
                        callback("")
                    }
                }

            }
        }
    }

    /**
     * Display the blog in edit mode.
     * @param {*} callback 
     */
    edit(callback) {

        // Show the paper-card where the blog will be display
        this.shadowRoot.querySelector(".blog-post-editor-div").style.display = ""
        this.shadowRoot.querySelector(".blog-post-reader-div").style.display = "none"

        if (this.editorDiv != null) {
            if (this.blog != null) {
                if (this.blog.getTitle().length > 0) {
                    this.shadowRoot.querySelector("#blog-editor-title").innerHTML = this.blog.getTitle()
                    this.titleSpan.innerHTML = this.blog.getTitle()
                    this.titleInput.value = this.blog.getTitle()
                    this.subtitleInput.value = this.blog.getSubtitle()
                    this.titleSpan.style.color = "var(--palette-text-primary)"
                    this.shadowRoot.querySelector("#blog-editor-title").style.color = "var(--palette-text-primary)"
                } else {
                    this.titleSpan.style.color = "var(--palette-action-disabled)"
                    this.shadowRoot.querySelector("#blog-editor-title").style.color = "var(--palette-action-disabled)"
                    this.shadowRoot.querySelector("#blog-editor-title").innerHTML = ` ${Application.account.name}, express yourself`
                }
            }
            callback(this.editorDiv)
            return
        }

        this.editorDiv = document.createElement("div")
        this.editorDiv.id = "_" + uuidv4() + "editorjs"
        this.editorDiv.slot = "edit-blog-content"
        this.editorDiv.style = "min-height: 230px;"
        this.appendChild(this.editorDiv)

        let data = {}
        if (this.blog != undefined) {
            data = JSON.parse(this.blog.getText())
            if (this.blog.getTitle().length > 0) {
                this.shadowRoot.querySelector("#blog-editor-title").innerHTML = this.blog.getTitle()
                this.titleSpan.innerHTML = this.blog.getTitle()
                this.titleInput.value = this.blog.getTitle()
                this.subtitleInput.value = this.blog.getSubtitle()
                this.titleSpan.style.color = "var(--palette-text-primary)"
                this.shadowRoot.querySelector("#blog-editor-title").style.color = "var(--palette-text-primary)"
            } else {
                this.titleSpan.style.color = "var(--palette-action-disabled)"
                this.shadowRoot.querySelector("#blog-editor-title").style.color = "var(--palette-action-disabled)"
                this.shadowRoot.querySelector("#blog-editor-title").innerHTML = ` ${Application.account.name}, express yourself`
            }

            if (this.blog.getAuthor() != Application.account.getId() + "@" + Application.account.getDomain()) {
                ApplicationView.displayMessage("your not allowed to edit ", this.blog.getAuthor(), " post!", 3000)
                return
            }

            this.keywordsEditList.setValues(this.blog.getKeywordsList())
        }

        const editor = this.editor = new EditorJS({
            holder: this.editorDiv.id,
            autofocus: true,
            /** 
             * Available Tools list. 
             * Pass Tool's class or Settings object for each Tool you want to use 
             * 
             * linkTool: {
                    class: LinkTool,
                    config: {
                        endpoint: 'http://localhost:8008/fetchUrl', // Your backend endpoint for url data fetching
                    }
                },
             */
            tools: {
                header: Header,
                delimiter: Delimiter,
                quote: Quote,
                list: NestedList,
                checklist: {
                    class: Checklist,
                    inlineToolbar: true,
                },
                table: Table,
                paragraph: {
                    class: Paragraph,
                    inlineToolbar: true,
                },
                underline: Underline,
                code: CodeTool,
                raw: RawTool,
                embed: {
                    class: Embed,
                    inlineToolbar: false,
                    config: {
                        services: {
                            youtube: true,
                            coub: true,
                            codepen: true,
                            imgur: true,
                            gfycat: true,
                            twitchvideo: true,
                            vimeo: true,
                            vine: true,
                            twitter: true,
                            instagram: true,
                            aparat: true,
                            facebook: true,
                            pinterest: true,
                        }
                    },
                },
                image: SimpleImage,
                files: FileDropZoneTool
            },
            data: data,
            onReady: () => {
                new Undo({ editor });
                new DragDrop(editor);
            }
        });


        // Move the editor inside the 
        this.editor.isReady
            .then(() => {
                /** Do anything you need after editor initialization */
                this.editorDiv.querySelector(".codex-editor__redactor").style.paddingBottom = "0px";
                /** done with the editor initialisation */

                callback()
            })
            .catch((reason) => {
                ApplicationView.displayMessage(`Editor.js initialization failed because of ${reason}`, 3000)
            });


    }


    /**
     * Display the blog in read mode.
     * @param {*} callbak 
     */
    read(callback) {
        this.shadowRoot.querySelector(".blog-post-editor-div").style.display = "none"
        this.shadowRoot.querySelector(".blog-post-reader-div").style.display = ""

        // Here I will replace existing elements with new one...
        let elements = this.querySelectorAll(`[slot="read-only-blog-content"]`)
        for (var i = 0; i < elements.length; i++) {
            this.removeChild(elements[i])
        }

        if (this.editor != null) {
            this.editor.save().then((outputData) => {
                let div = jsonToHtml(outputData)
                this.appendChild(div)
                callback()
            })
        } else {
            let div = jsonToHtml(JSON.parse(this.blog.getText()))
            this.appendChild(div)
            callback()
        }
    }

    /**
     * Clear the content of blog read and writh editor
     */
    clear() {
        this.blog = null
        this.removeChild(this.editorDiv);
        this.editorDiv = null;
        this.editor = null;
        this.titleInput.value = ""
        this.subtitleInput.value = ""
        this.titleSpan.innerHTML = ` ${Application.account.name}, express yourself`
        this.keywordsEditList.setValues([])

        // reset the editor.
        this.edit(() => {

        })
    }

    /**
     * Save the blog and publish it...
     */
    publish() {
        this.editor.save().then((outputData) => {
            if (this.blog == null) {
                let globule = this.globule // see if the blog need domain...
                let rqst = new CreateBlogPostRequest
                rqst.setIndexpath(globule.config.DataPath + "/search/blogPosts")
                rqst.setAccountId(Application.account.getId() + "@" + Application.account.getDomain())
                rqst.setText(JSON.stringify(outputData));
                rqst.setLanguage(navigator.language.split("-")[0])
                rqst.setTitle(this.titleInput.value)
                rqst.setSubtitle(this.subtitleInput.value)
                rqst.setKeywordsList(this.keywordsEditList.getValues())

                // if the title is empty I will set it from the firt h1 found in the text...
                if (this.titleInput.value)
                    if (this.titleInput.value.length == 0) {
                        let h1 = this.editorDiv.querySelectorAll("h1")
                        if (h1.length > 0) {
                            rqst.setTitle(h1[0].innerHTML)
                        }
                    }

                // do the same with subtitle...
                if (this.subtitleInput.value)
                    if (this.subtitleInput.value.length == 0) {
                        let h2 = this.editorDiv.querySelectorAll("h2")
                        if (h2.length > 0) {
                            rqst.setSubtitle(h2[0].innerHTML)
                        }
                    }

                let createBlog = () => {
                    generatePeerToken(globule, token => {
                        globule.blogService.createBlogPost(rqst, { domain: Model.domain, application: Model.application, address: Model.address, token: token })
                            .then(rsp => {
                                this.blog = rsp.getBlogPost();
                                ApplicationView.displayMessage("Your post is published!", 3000)

                                // Publish the event
                                Model.publish(Application.account.getId() + "@" + Application.account.getDomain() + "_publish_blog_event", this.blog.serializeBinary(), false)
                                if (this.blog.getThumbnail().length > 0) {
                                    this.shadowRoot.querySelector("globular-image-selector").setImageUrl(this.blog.getThumbnail())
                                }
                            }).catch(e => {
                                ApplicationView.displayMessage(e, 3000)
                            })
                    }, err => ApplicationView.displayMessage(err, 3000))


                }

                if (this.blog) {
                    if (this.blog.getThumbnail().length == 0) {
                        this.getThumbnail(500, dataUrl => { rqst.setThumbnail(dataUrl); createBlog(); })
                    } else {
                        createBlog();
                    }

                } else {
                    this.getThumbnail(500, dataUrl => { rqst.setThumbnail(dataUrl); createBlog(); })
                }

            } else {

                let rqst = new SaveBlogPostRequest
                let globule = this.globule
                rqst.setIndexpath(globule.config.DataPath + "/search/blogPosts")
                this.blog.setText(JSON.stringify(outputData))
                this.blog.setLanguage(navigator.language.split("-")[0])
                this.blog.setTitle(this.titleInput.value)
                this.blog.setSubtitle(this.subtitleInput.value)
                this.blog.setKeywordsList(this.keywordsEditList.getValues())

                // Set the blogpost status...
                if (this.shadowRoot.querySelector("paper-radio-group").selected == "draft") {
                    this.blog.setStatus(0)
                } else if (this.shadowRoot.querySelector("paper-radio-group").selected == "published") {
                    this.blog.setStatus(1)
                } else if (this.shadowRoot.querySelector("paper-radio-group").selected == "archived") {
                    this.blog.setStatus(2)
                }

                // set request parameters
                rqst.setUuid(this.blog.getUuid())
                rqst.setBlogPost(this.blog)

                let saveBlog = () => {
                    generatePeerToken(globule, token => {
                        globule.blogService.saveBlogPost(rqst, { domain: Model.domain, application: Model.application, address: Model.address, token: token })
                            .then(rsp => {
                                ApplicationView.displayMessage("Your post was updated!", 3000)

                                // That function will update the blog...
                                globule.eventHub.publish(this.blog.getUuid() + "_blog_updated_event", this.blog.getUuid(), false)
                                if (this.blog.getThumbnail().length > 0) {
                                    this.shadowRoot.querySelector("globular-image-selector").setImageUrl(this.blog.getThumbnail())
                                }
                            }).catch(e => {
                                ApplicationView.displayMessage(e, 3000)
                            })

                    }, err => ApplicationView.displayMessage(err, 3000))
                }

                // set the thumbnail and save the blog...
                if (this.blog.getThumbnail().length == 0) {
                    this.getThumbnail(500, dataUrl => { this.blog.setThumbnail(dataUrl); saveBlog() })
                } else {
                    saveBlog()
                }

            }

        }).catch((error) => {
            console.log('Saving failed: ', error)
            ApplicationView.displayMessage(`Saving failed: ${error}`, 3000)
        });
    }
}

customElements.define('globular-blog-post', BlogPostElement)

/**
 * Test if string is a valid json.
 * @param {*} str 
 * @returns 
 */
function isJson(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}



/**
 * Simple class to display a group of video files. (video must have video infos...)
 */
export class EmbeddedVideos extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });
    }

    // The connection callback.
    connectedCallback() {

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            #container{
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
                display: flex;
                flex-direction: column;
                position: relative;

            }

            #videos{
                display: flex;
                flex-wrap: wrap;
            }

            #play-all-btn {
                position:absolute;
                top: 0px; 
                right: 0px;
                z-index: 100;
            }

        </style>
        <div id="container">
            <paper-icon-button id="play-all-btn" title="play all video" icon="av:playlist-play"></paper-icon-button>
            <div id="videos">
                <slot></slot>
            </div>
        </div>
        `

        // Keep a reference to the videos.
        this.videos = []
        this.playAllBtn = this.shadowRoot.querySelector("#play-all-btn")

        this.playAllBtn.onclick = (evt) => {
            playVideos(this.videos, "videos list")
        }
    }

    getVideo(index) {
        return this.videos[index]
    }

    removeVideo(video) {
        if (this.onremovevideo) {
            this.onremovevideo(video)
        }
    }

    setVideos(videos) {
        this.videos = videos
        this.innerHTML = ""

        if (videos.length > 4) {
            let carousel = new Carousel
            carousel.style.width = "100%"

            // put video info in the carousel.
            carousel.setItems(videos)

            // set the carousel...
            this.appendChild(carousel)

        } else {
            // Create video card's
            this.videos.forEach(video => {
                let card = new SearchVideoCard
                card.setVideo(video)
                card.onclose = () => {
                    this.removeChild(card)
                    this.removeVideo(video.file.path)
                }
                card.setEditable(this.editable)
                this.appendChild(card)
            })
        }
    }

    getImages(){
        let images = []
        for (var i = 0; i < this.videos.length; i++) {
            let img = document.createElement("img")
            img.src = this.videos[i].getPoster().getContenturl()
            images.push(img)
        }
        return images;
    }

    // hide or show the edit button...
    setEditable(editable) {
        this.editable = editable;
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].setEditable(editable)
        }
    }
}

customElements.define('globular-embedded-videos', EmbeddedVideos)


/**
 * Simple class to display a group of audios files.
 */
export class EmbeddedAudios extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            #container{
                position: relative;
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
                display: flex;
                flex-direction: column;

            }

            #audios{
                display: flex;
                flex-wrap: wrap;
            }

            #play-all-btn {
                position:absolute;
                top: 0px; 
                right: 0px;
                z-index: 100;
            }

        </style>
        <div id="container">
            <paper-icon-button id="play-all-btn" title="play all audio" icon="av:playlist-play"></paper-icon-button>
            <div id="audios">
                <slot></slot>
            </div>
        </div>
        `

        // Keep a reference to the audios.
        this.audios = []

        this.playAllBtn = this.shadowRoot.querySelector("#play-all-btn")

        this.playAllBtn.onclick = (evt) => {
            playAudios(this.audios, "audio list")
        }
    }

    getAudio(index) {
        return this.audios[index]
    }

    removeAudio(audio) {
        if (this.onremoveaudio) {
            this.onremoveaudio(audio)
        }
    }

    setAudios(audios) {
        this.audios = audios
        this.innerHTML = ""

        if (audios.length > 4) {
            let carousel = new Carousel
            carousel.style.width = "100%"

            // put video info in the carousel.
            carousel.setItems(audios)

            // set the carousel...
            this.appendChild(carousel)

        } else {
            // Create video card's
            this.audios.forEach(audio => {
                let card = new SearchAudioCard
                card.setAudio(audio)
                card.onclose = () => {
                    this.removeChild(card)
                    this.removeAudio(audio.file.path)
                }
                card.setEditable(this.editable)
                this.appendChild(card)
            })
        }
    }

    // hide or show the edit button...
    setEditable(editable) {
        this.editable = editable;
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].setEditable(editable)
        }
    }

    getImages(){
        let images = []
        for (var i = 0; i < this.audios.length; i++) {
            let img = document.createElement("img")
            img.src = this.audios[i].getPoster().getContenturl()
            images.push(img)
        }
        return images;
    }
}

customElements.define('globular-embedded-audios', EmbeddedAudios)

/**
 * That component will be use to display file(s) into a post.
 */
export class FileDropZone extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {

        super()

        // The list of paths
        this.files = []


        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            #zone{
                position: relative;
                margin-top: 10px;
                margin-bottom: 10px;
                padding: 5px;
                min-height: 200px;
                border-radius: 5px;
                transition: background 0.2s ease,padding 0.8s linear;
            }

            .editable {
                background-color: var(--palette-background-paper);
                border: 2px dashed var(--palette-divider);
            }

            #loading{
                position: absolute; 
                display: flex;
                top: 0px;
                left: 0px;
                right: 0px;
                bottom: 0px;
                border: 1px solid var(--palette-divider);
                justify-content: center;
                align-items: center;
                border-radius: 10px;
            }

            #loading paper-spinner{

            }

        </style>

        <div  id="zone">
            <slot></slot>
        </div>
        `

        // So here I will make the zone drop-able....
        this.dropZone = this.shadowRoot.querySelector("#zone")

        this.dropZone.ondragenter = (evt) => {
            if (!this.hasAttribute("editable")) {
                return
            }

            evt.stopPropagation();
            evt.preventDefault();
            this.dropZone.style.filter = "invert(10%)"

        }

        this.dropZone.ondragover = (evt) => {
            if (!this.hasAttribute("editable")) {
                return
            }
            evt.stopPropagation();
            evt.preventDefault();
        }

        this.dropZone.ondragleave = (evt) => {
            if (!this.hasAttribute("editable")) {
                return
            }

            evt.preventDefault()
            this.dropZone.style.filter = ""
        }

        this.dropZone.ondrop = (evt) => {
            if (!this.hasAttribute("editable")) {
                return
            }

            evt.stopPropagation();
            evt.preventDefault();

            this.dropZone.style.filter = ""

            // So now I will create component to be display in the blog
            // based on the file type. Those component created to fit well
            // on a simple layout (no pop-pup).
            let paths = JSON.parse(evt.dataTransfer.getData('files'))
            let domain = evt.dataTransfer.getData('domain')

            // keep track
            paths.forEach(path => {
                this.files.push({ domain: domain, path: path })
            })

            this.render()
        }

        if (this.hasAttribute("files")) {
            let jsonStr = atob(this.getAttribute("files"))
            if (isJson(jsonStr)) {
                this.files = JSON.parse(jsonStr)
            }
            this.render()
        }

    }

    setEditable(editable) {
        this.editable = editable

        if (editable) {
            this.dropZone.classList.add("editable")
            this.setAttribute("editable", "true")
        } else {
            this.dropZone.classList.remove("editable")
            this.removeAttribute("editable")
        }
    }

    // Call search event.
    setFiles(files) {
        this.files = files
        this.render()
    }

    getFiles() {
        return this.files // the list of files path
    }

    getFilesInfo(callback) {

        // the loading display
        let loading = document.createElement("div")
        loading.id = "loading"
        let spinner = document.createElement("paper-spinner")
        spinner.setAttribute("active", "")
        loading.appendChild(spinner)
        this.dropZone.appendChild(loading)

        let files = []
        let getFileInfo = (index) => {
            let path = this.files[index].path
            let g = Model.getGlobule(this.files[index].domain)
            index++
            File__.getFile(g, path, 80, 80,
                file => {
                    files.push(file)
                    if (index == this.files.length) {
                        if (loading.parentNode)
                            loading.parentNode.removeChild(loading)
                        callback(files)
                    } else {
                        getFileInfo(index)
                    }
                },
                err => {
                    if (index == this.files.length) {
                        if (loading.parentNode)
                            loading.parentNode.removeChild(loading)
                        callback(files)
                    } else {
                        getFileInfo(index)
                    }
                })
        }

        if (this.files.length > 0) {
            let index = 0
            getFileInfo(index)
        } else {
            if (loading.parentNode)
                loading.parentNode.removeChild(loading)
        }
    }

    // This function will display the files.
    render() {
        this.getFilesInfo(files => {
            let filesByType = {}
            files.forEach(f => {
                let fileType = f.mime.split("/")[0]
                if (!filesByType[fileType]) {
                    filesByType[fileType] = []
                }
                filesByType[fileType].push(f)
            })

            if (filesByType["image"]) {
                this.renderImages(filesByType["image"])
            }

            if (filesByType["audio"]) {
                this.renderAudio(filesByType["audio"])
            }

            if (filesByType["video"]) {
                this.renderVideos(filesByType["video"])
            }

        })
    }

    /**
     * Render video.
     * @param {*} videos 
     */
    renderVideos(files) {

        // so here I will initalyse files and their video informations.
        let index = 0;
        let videos_ = []

        // Get the video informations...
        let initVideoInfo = (index, callback) => {
            let file = files[index]
            index++
            getVideoInfo(file, videos => {
                if (videos.length > 0) {
                    let video = videos[0]
                    video.file = file
                    videos_.push(video)
                    if (index < files.length) {
                        initVideoInfo(index, callback)
                    } else {
                        callback(videos_)
                    }
                } else {
                    if (index < files.length) {
                        initVideoInfo(index, callback)
                    } else {
                        callback(videos_)
                    }
                }
            })
        }

        if (files.length > 0) {
            initVideoInfo(index, videos => {
                let embeddedVideos = this.querySelector("globular-embedded-videos")
                if (!embeddedVideos) {
                    embeddedVideos = new EmbeddedVideos()
                    embeddedVideos.onremovevideo = (path) => {
                        this.files = this.files.filter(e => e.path !== path);
                    }
                }

                this.appendChild(embeddedVideos)
                embeddedVideos.setVideos(videos)

                if (this.parentNode) {
                    if (this.parentNode.classList.contains("ce-block__content")) {
                        this.setEditable(true)
                        embeddedVideos.setEditable(true)
                    } else {
                        this.setEditable(false)
                        embeddedVideos.setEditable(false)
                    }
                }

            })
        }
    }

    renderAudio(files) {

        // so here I will initalyse files and their video informations.
        let index = 0;
        let audios_ = []

        // Get the video informations...
        let initAudioInfo = (index, callback) => {
            let file = files[index]
            index++
            getAudioInfo(file, audios => {
                if (audios.length > 0) {
                    let audio = audios[0]
                    audio.file = file
                    audios_.push(audio)
                    if (index < files.length) {
                        initAudioInfo(index, callback)
                    } else {
                        callback(audios_)
                    }
                } else {
                    if (index < files.length) {
                        initAudioInfo(index, callback)
                    } else {
                        callback(audios_)
                    }
                }
            })
        }

        if (files.length > 0) {
            initAudioInfo(index, audios => {
                let embeddedAudios = this.querySelector("globular-embedded-audios")
                if (!embeddedAudios) {
                    embeddedAudios = new EmbeddedAudios()
                    embeddedAudios.onremoveaudio = (path) => {
                        this.files = this.files.filter(e => e.path !== path);
                    }
                }

                this.appendChild(embeddedAudios)
                embeddedAudios.setAudios(audios)

                if (this.parentNode) {
                    if (this.parentNode.classList.contains("ce-block__content")) {
                        this.setEditable(true)
                        embeddedAudios.setEditable(true)
                    } else {
                        this.setEditable(false)
                        embeddedAudios.setEditable(false)
                    }
                }

            })
        }
    }

    renderImages(images) {

        // Set the image Gallery...
        let imageGallery = this.querySelector("globular-image-gallery")
        if (!imageGallery) {
            imageGallery = new ImageGallery
            imageGallery.onremoveimage = (url) => {
                this.files = this.files.filter(e => e.path !== url);
            }
        }

        this.appendChild(imageGallery)

        let urls = []
        let index = 0
        let getImageUrl = (index) => {
            let img = images[index]
            index++
            generatePeerToken(img.globule, token => {
                let url = getUrl(img.globule)
                img.path.split("/").forEach(item => {
                    item = item.trim()
                    if (item.length > 0) {
                        url += "/" + encodeURIComponent(item)
                    }
                })
                url += `?token=${token}`
                urls.push(url)
                if (index < images.length) {
                    getImageUrl(index)
                } else {
                    imageGallery.setImages(urls)
                }
            }, err => {
                if (index < images.length) {
                    getImageUrl(index)
                } else {
                    imageGallery.setImages(urls)
                }
            })
        }

        getImageUrl(index)

        if (this.parentNode) {
            if (this.parentNode.classList.contains("ce-block__content")) {
                this.setEditable(true)
                imageGallery.setEditable(true)
            } else {
                this.setEditable(false)
                imageGallery.setEditable(false)
            }
        }
    }

    connectedCallback() {
        if (this.parentNode.classList.contains("ce-block__content")) {
            this.setEditable(true)
        } else {
            this.setEditable(false)
        }
    }
}

customElements.define('globular-file-drop-zone', FileDropZone)

// So here I will 
export default class FileDropZoneTool {

    constructor({ data, api }) {
        this.data = data
        this.api = api
        this.api.caret.focus(false);
        this.api.caret.setToBlock('start', 0);
        this.dropZone = new FileDropZone()
        if (data["files"]) {
            this.dropZone.setFiles(data["files"])
        }
    }

    render() {
        let range = document.createRange()
        let jsonStr = JSON.stringify(this.data["files"])
        let html = `<globular-file-drop-zone files='${btoa(jsonStr)}'>  </globular-file-drop-zone>`;
        this.dropZone = range.createContextualFragment(html)

        return this.dropZone;
    }

    static get toolbox() {
        return {
            title: 'File Selector',
            icon:
                '<svg width="17" height="15" viewBox="0 0 336 276" xmlns="http://www.w3.org/2000/svg"><path d="M291 150V79c0-19-15-34-34-34H79c-19 0-34 15-34 34v42l67-44 81 72 56-29 42 30zm0 52l-43-30-56 30-81-67-66 39v23c0 19 15 34 34 34h178c17 0 31-13 34-29zM79 0h178c44 0 79 35 79 79v118c0 44-35 79-79 79H79c-44 0-79-35-79-79V79C0 35 35 0 79 0z"/></svg>',
        };
    }

    save(blockContent) {
        return {
            files: blockContent.getFiles()
        };
    }
}

/**
 * Display globular blog list.
 */
export class BlogPosts extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(userName) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            #blog-lst-div{
                display: flex;
                justify-content: center;
                flex-direction: column;
                background-color: var(--palette-background-paper);
                color: var(--palette-text-primary);
            }

            .blogs{
                display: flex;
                flex-direction: column;
            }

            h2{
                margin-bottom: 4px;
                margin-left: 10px;
                border-bottom: 1px solid var(--palette-divider);
                width: 80%;
            }

            #new-blog-post-btn {
                
            }

            paper-card {
                background-color: var(--palette-background-paper);
                margin-top: 10px;
                font-size: 1.65rem;
            }

            paper-card h1 {
                font-size: 1.65rem;
            }

            .card-content{
                display: flex;
                flex-direction: column;
                margin-top: 10px;
                margin-bottom: 10px;
                min-width: 728px;
                padding: 0px;
                font-size: 1rem;
              }
      
              @media (max-width: 800px) {
                .card-content{
                  min-width: 580px;
                }
              }
      
              @media (max-width: 500px) {
                .card-content, #blog-lst-div{
                  min-width: calc(100vw - 20px);
                }

                .blogs-div {
                    align-items: center;
                    justify-content: center;
                }
              }
            
        </style>
            <paper-card id="blog-lst-div">
                <div class="card-content">
                    <div style="display: flex; border: none;">
                        <div style="display: flex; flex-direction: column; padding-left:10px; flex-grow: 1;">
                            <h1 id="blog-title" style="margin:0px;" >Blog(s)</h1>
                            <div style="display: flex; align-items: center;">
                                <span>new post</span>
                                <paper-icon-button id="new-blog-post-btn" icon="icons:add" title="Create new Post"></paper-icon-button>
                            </div>
                        </div>
                        <paper-icon-button id="close-btn" icon="icons:close" title="Create new Post"></paper-icon-button>
                    </div>
                    <div class="blogs">
                        <h2 id="draft-title">Draft(s)</h2>
                        <div class="blogs-div" style="display: flex; flex-wrap: wrap;">
                            <slot name="draft"></slot>
                        </div>
                    </div>
                    <div class="blogs">
                        <h2 id="published-title">Published(s)</h2>
                        <div class="blogs-div" style="display: flex; flex-wrap: wrap;">
                            <slot name="published"></slot>
                        </div>
                    </div>
                    <div class="blogs">
                        <h2 id="archived-title">Archived(s)</h2>
                        <div class="blogs-div" style="display: flex; flex-wrap: wrap;">
                            <slot name="archived"></slot>
                        </div>
                    </div>
                </div>
            </paper-card>
       
        `

        this.onclose = null

        // simply close the watching content...
        this.shadowRoot.querySelector("#close-btn").onclick = () => {
            this.parentNode.removeChild(this)
            if (this.onclose != null) {
                this.onclose()
            }
        }

        this.listeners = {}


        // Display the blog post editor...
        this.shadowRoot.querySelector("#new-blog-post-btn").onclick = () => {
            // Test the blog-post
            let editor = new BlogPostElement()
            editor.setAttribute("editable", "true")
            let parentNode = this.parentNode
            parentNode.removeChild(this)
            parentNode.appendChild(editor)

            editor.onclose = () => {
                this.removeAttribute("editable")
                parentNode.removeChild(editor)
                parentNode.appendChild(this)
            }
        }

        // If the blog editor is set to true...
        let authors = []
        Account.getAccount(userName,
            account => {
                // Subcribe to my own blog create event...
                Model.getGlobule(account.domain).eventHub.subscribe(account.id + "@" + account.domain + "_publish_blog_event", uuid => this[account.getId() + "@" + account.getDomain() + "_publish_blog_listener"] = uuid,
                    evt => {
                        // Get the date from the event and create the newly
                        this.setBlog(BlogPost.deserializeBinary(Uint8Array.from(evt.split(","))), true)
                    }, false, this)

                authors.push(account.id + "@" + account.domain)

                this.getBlogs(authors, blogs => {
                    this.setBlogPosts(blogs)
                })
            })
    }

    // Retreive all blog from all connected peers...
    getBlogs(authors, callback) {
        let connections = Array.from(Model.getGlobules())
        let blogs_ = []

        let _getBlogs_ = () => {
            let globule = connections.pop()
            if (connections.length == 0) {
                this._getBlogs(globule, authors, (blogs) => {
                    blogs_ = blogs_.concat(blogs)
                    blogs_ = blogs_.filter((b0, index, self) =>
                        index === self.findIndex((b1) => (
                            b0.getUuid() === b1.getUuid()
                        ))
                    )
                    this.onloaded()
                    callback(blogs_)
                })
            } else {
                this._getBlogs(globule, authors, (blogs) => {
                    blogs_ = blogs_.concat(blogs)
                    blogs_ = blogs_.filter((b0, index, self) =>
                        index === self.findIndex((b1) => (
                            b0.getUuid() === b1.getUuid()
                        ))
                    )
                    _getBlogs_() // get the account from the next globule.
                })
            }
        }

        // get account from all register peers.
        _getBlogs_()
    }

    // Get the list of blogs.
    _getBlogs(globule, authors, callback) {

        generatePeerToken(globule, token => {
            let rqst = new GetBlogPostsByAuthorsRequest
            rqst.setAuthorsList(authors)
            rqst.setMax(100)

            let stream = globule.blogService.getBlogPostsByAuthors(rqst, { domain: Model.domain, application: Model.application, address: Model.address, token: token });
            let blogs = []

            stream.on("data", (rsp) => {
                blogs.push(rsp.getBlogPost())
            });

            stream.on("status", (status) => {
                if (status.code == 0) {
                    callback(blogs)
                } else {
                    callback([])
                }
            })
        }, err => ApplicationView.displayMessage(err, 3000))


    }

    setBlog(b) {
        let blogInfo = this.querySelector("#_" + b.getUuid() + "_info")
        if (blogInfo == undefined) {
            blogInfo = new BlogPostInfo(b, true)
            blogInfo.id = "_" + b.getUuid() + "_info"
            this.appendChild(blogInfo)
        }

        if (b.getStatus() == 0) {
            blogInfo.slot = "draft"
        } else if (b.getStatus() == 1) {
            blogInfo.slot = "published"
        } else if (b.getStatus() == 2) {
            blogInfo.slot = "archived"
        }

        // Display the total number of blog...
        this.shadowRoot.querySelector("#blog-title").innerHTML = `Blog(${this.querySelectorAll(`globular-blog-post-info`).length})`

        // Set the section titles.
        this.shadowRoot.querySelector("#draft-title").innerHTML = `Draft(${this.querySelectorAll(`[slot="draft"]`).length})`
        this.shadowRoot.querySelector("#published-title").innerHTML = `Published(${this.querySelectorAll(`[slot="published"]`).length})`
        this.shadowRoot.querySelector("#archived-title").innerHTML = `Archived(${this.querySelectorAll(`[slot="archived"]`).length})`

        // listen for change...
        if (this.listeners[b.getUuid() + "_blog_updated_event_listener"] == undefined) {

            Model.getGlobule(b.getDomain()).eventHub.subscribe(b.getUuid() + "_blog_updated_event", uuid => {
                this.listeners[b.getUuid() + "_blog_updated_event_listener"] = uuid
            }, evt => {
                // so here I will refresh the blog...
                readBlogPost(b.getDomain(), b.getUuid(), b => {
                    this.setBlog(b)
                }, err => ApplicationView.displayMessage(err, 3000))
            }, false, this)
        }

        Model.eventHub.subscribe("_blog_delete_event_", uuid => { },
            evt => {
                // The number of blog has change...
                let blogInfo = this.querySelector("#_" + evt + "_info")
                if (blogInfo) {
                    if (blogInfo.parentNode != undefined) {
                        blogInfo.parentNode.removeChild(blogInfo)
                    }
                }

                this.shadowRoot.querySelector("#blog-title").innerHTML = `Blog(${this.querySelectorAll(`globular-blog-post-info`).length})`

                this.shadowRoot.querySelector("#draft-title").innerHTML = `Draft(${this.querySelectorAll(`[slot="draft"]`).length})`
                this.shadowRoot.querySelector("#published-title").innerHTML = `Published(${this.querySelectorAll(`[slot="published"]`).length})`
                this.shadowRoot.querySelector("#archived-title").innerHTML = `Archived(${this.querySelectorAll(`[slot="archived"]`).length})`

            }, true)


    }

    // The list of blogs
    setBlogPosts(blogs) {
        blogs.sort((a, b) => { return b.getCreationtime() - a.getCreationtime() })
        blogs.forEach(b => {
            // This contain the 
            this.setBlog(b)
        })
    }

}

customElements.define('globular-blog-posts', BlogPosts)


/**
 * Comments
 */
export class BlogComments extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(blog, comment, globule) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
        </style>
        <div id="container" style="padding-left: 20px; border-top: 1px solid var(--palette-divider);">
            <slot name="blog-emotions"> </slot>
            <slot name="blog-comment-editor"></slot>
            <slot name="blog-comments"></slot>
        </div>
        `


        this.globule = globule
        if (!globule) {
            this.globule = Model.globular
        }

        // The emotions 
        this.emotions = new BlogEmotions(blog, comment, globule)
        this.emotions.slot = "blog-emotions"
        this.appendChild(this.emotions)

        // The comment editior
        this.editor = new BlogCommentEditor(blog, comment, globule)
        this.editor.slot = "blog-comment-editor"
        this.appendChild(this.editor)

        if (comment != undefined) {
            this.setComment(comment, blog)
        }

        if (blog != undefined) {
            this.setBlog(blog)
        }
    }

    setBlog(blog) {
        if (this.blog != undefined) {
            return
        }

        this.blog = blog
        this.editor.setBlog(blog)
        this.emotions.setBlog(blog)

        if (this.comment == undefined) {
            // Here I will connect the event channel for comment.
            Model.getGlobule(blog.getDomain()).eventHub.subscribe("new_" + this.blog.getUuid() + "_comment_evt",
                uuid => this["new_blog_" + this.blog.getUuid() + "_comment_listener"] = uuid,
                evt => {
                    let comment = Comment.deserializeBinary(Uint8Array.from(evt.split(",")))
                    this.appendComment(comment, blog)
                }, false, this)

            // Display the comment...
            this.blog.getCommentsList().forEach(c => {
                this.appendComment(c, blog)
            })
        }
    }

    setComment(comment, blog) {
        if (this.comment != undefined) {
            return
        }

        this.comment = comment
        this.editor.setComment(comment)
        this.emotions.setComment(comment)

        // Here I will connect the event channel for comment.
        Model.getGlobule(blog.getDomain()).eventHub.subscribe("new_" + this.comment.getUuid() + "_comment_evt",
            uuid => this["new_" + this.comment.getUuid() + "_comment_listener"] = uuid,
            evt => {
                let comment = Comment.deserializeBinary(Uint8Array.from(evt.split(",")))
                this.appendComment(comment, blog)
            }, false, this)

        // Display the comment...
        this.comment.getCommentsList().forEach(c => {
            this.appendComment(c, blog)
        })

    }

    // Append a new comment into the list of comment.
    appendComment(comment, blog) {

        if (this.comment != null) {
            this.shadowRoot.querySelector("#container").style.borderLeft = "1px solid var(--palette-action-disabled)"
        }

        // append the comment once.
        if (this.querySelector("#_" + comment.getUuid()) != undefined) {
            return
        }

        // So here I will display information about the comment 
        let blogComment = new BlogComment(blog, comment, this.globule)
        blogComment.slot = "blog-comments"
        this.prepend(blogComment)
        blogComment.display()
    }
}

customElements.define('globular-blog-comments', BlogComments)

/**
 * Comments
 */
export class BlogComment extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(blog, comment, globule) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        this.comment = comment;
        this.blog = blog;
        this.id = "_" + comment.getUuid()

        this.globule = globule
        if (!this.globule) {
            this.globule = Model.globular
        }

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
            ::-webkit-scrollbar {
                width: 5px;
                height: 5px;

            }
                
            ::-webkit-scrollbar-track {
                background: var(--palette-background-default);
            }
            
            ::-webkit-scrollbar-thumb {
                background: var(--palette-divider); 
            }
            .container{
                display: flex;
                flex-direction: column;
                padding: 8px 0px 8px 16px;
                overflow: auto;
            }

            #blog-comment-author-id, #blog-comment-time{
                font-size: .85rem;
            }

            #blog-comment-time{
                align-self: flex-end;
                padding-right: 10px;
            }


        </style>
        <div class="container" id="_${comment.getUuid()}">
            <div style="display: flex;">
                <div style="display: flex; flex-direction: column; padding-right: 10px;">
                    <div>
                        <img id="blog-comment-author-blog-post" style="width: 32px; height: 32px; border-radius: 16px; display:none;"></img>
                        <iron-icon id="blog-comment-author-icon"  icon="account-circle" style="width: 34px; height: 34px; --iron-icon-fill-color:var(--palette-action-disabled); display: block;"></iron-icon>
                        
                    </div>
                    <span  id="blog-comment-author-id"></span>
                </div>
                <div id="comment-text-div">
                </div>
            </div>
            <div id="blog-comment-time"></div>
            <slot name="blog-comments"></slot>
            
        </div>
        `

        // The comments container...
        this.blogComments = new BlogComments(blog, comment, this.globule)
        this.blogComments.slot = "blog-comments"
        this.appendChild(this.blogComments)

        // Here I will set the blog various information...
        let authorIdSpan = this.shadowRoot.querySelector("#blog-comment-author-id")
        authorIdSpan.innerHTML = comment.getAccountId()

        Account.getAccount(comment.getAccountId(), a => {
            let img = this.shadowRoot.querySelector("#blog-comment-author-blog-post")
            let ico = this.shadowRoot.querySelector("#blog-comment-author-icon")
            if (a.profile_picture != undefined) {
                img.src = a.profile_picture
                img.style.display = "block"
                ico.style.display = "none"
            }

        }, e => {
            console.log(e)
        })

        let timeDiv = this.shadowRoot.querySelector("#blog-comment-time");
        let commentCreationTime = new Date(comment.getCreationtime() * 1000)
        setInterval(() => {
            timeDiv.innerHTML = timeSince(commentCreationTime)
        }, 1000)

    }

    display() {
        let textDiv = this.shadowRoot.querySelector("#comment-text-div")
        textDiv.innerHTML = ""
        textDiv.appendChild(jsonToHtml(JSON.parse(this.comment.getText())))

    }

    editComment() {

    }

}

customElements.define('globular-blog-comment', BlogComment)

/**
 * Comments
 */
export class BlogCommentEditor extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(blog, comment, globule) {
        super()

        this.blog = blog
        this.comment = comment
        this.globule = globule
        if (!this.globule) {
            this.globule = Model.globular
        }

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           

            .add-comment-btn{
                transition: all 1s ease,padding 0.8s linear;
                display: flex;
                align-items: baseline;
                color: var(--palette-action-disabled);
                position: relative;
            }

            .add-comment-btn:hover{
                cursor: pointer;
            }

        </style>
        <div style="display: flex; flex-direction: column; position: relative;">
            <div class="add-comment-btn" style="display: flex;">
                <div style="border-bottom: 1px solid var(--palette-action-disabled); min-width: 200px; margin-right: 5px; text-align: left;">
                    <iron-icon  style="width: 16px; height: 16px; --iron-icon-fill-color:var(--palette-action-disabled);" icon="add"></iron-icon>
                    <span>add comment</span> 
                    <paper-ripple recenters></paper-ripple>
                </div>
                <div>
                    <paper-icon-button id="collapse-btn" icon="editor:insert-emoticon" style="--iron-icon-fill-color:var(--palette-action-disabled);"></paper-icon-button>
                </div>
            </div>
            <div style="display: flex; flex-direction: column; width: 100%;">
                <slot name="edit-comment-content"></slot>
                <iron-collapse id="collapse-panel" style="display: flex; flex-direction: column;">
                    <emoji-picker></emoji-picker>
                </iron-collapse>
                <div id="edit-comment-content" style="display: none; width: 100%; justify-content: end;">
                    <paper-button id="cancel-blog-comment">Cancel</paper-button>
                    <paper-button id="publish-blog-comment">Publish</paper-button>
                </div>
            </div>
        </div>

        `

        this.collapse_btn = this.shadowRoot.querySelector("#collapse-btn")
        this.collapse_panel = this.shadowRoot.querySelector("#collapse-panel")
        this.editDiv = this.shadowRoot.querySelector("#edit-comment-content")

        this.collapse_btn.onclick = () => {
            if (!this.collapse_panel.opened) {
                this.collapse_btn.icon = "icons:close"
            } else {
                this.collapse_btn.icon = "editor:insert-emoticon"
            }
            this.collapse_panel.toggle();
        }

        let emojiPicker = this.shadowRoot.querySelector("emoji-picker")
        emojiPicker.addEventListener('emoji-click', event => {
            this.collapse_btn.icon = "editor:insert-emoticon"
            this.collapse_panel.toggle();
            generatePeerToken(this.globule, token => {
                let rqst = new AddEmojiRequest
                let emoji = new Emoji
                emoji.setAccountId(Application.account.getId() + "@" + Application.account.getDomain())
                emoji.setEmoji(JSON.stringify(event.detail))
                emoji.setParent(this.blog.getUuid())
                if (comment != undefined) {
                    emoji.setParent(comment.getUuid())
                }

                rqst.setUuid(this.blog.getUuid())
                rqst.setEmoji(emoji)

                this.globule.blogService.addEmoji(rqst, { domain: Model.domain, application: Model.application, address: Model.address, token: token })
                    .then(rsp => {
                        this.globule.eventHub.publish(emoji.getParent() + "_new_emotion_event", rsp.getEmoji().serializeBinary(), false)
                    })
                    .catch(e => {
                        ApplicationView.displayMessage(e, 3000)
                    })
            }, e => ApplicationView.displayMessage(e, 3000))



        });

        // Set the comment editior
        let addCommentBtn = this.shadowRoot.querySelector(".add-comment-btn")
        this.shadowRoot.querySelector("paper-ripple").ontransitionend = () => {
            addCommentBtn.style.display = "none"
            this.editDiv.style.display = ""
            this.editorDiv = document.createElement("div")
            this.editorDiv.id = "_" + uuidv4() + "editorjs"
            this.editorDiv.slot = "edit-comment-content"
            this.editorDiv.style = "width: 100%;"
            this.appendChild(this.editorDiv)

            let data = {}

            // Here I will create the editor...
            // Here I will create a new editor...
            this.editor = new EditorJS({
                holder: this.editorDiv.id,
                autofocus: true,
                tools: {
                    header: Header,
                    delimiter: Delimiter,
                    quote: Quote,
                    list: NestedList,
                    checklist: {
                        class: Checklist,
                        inlineToolbar: true,
                    },
                    table: Table,
                    paragraph: {
                        class: Paragraph,
                        inlineToolbar: true,
                    },
                    underline: Underline,
                    code: CodeTool,
                    raw: RawTool,
                    embed: {
                        class: Embed,
                        inlineToolbar: false,
                        config: {
                            services: {
                                youtube: true,
                                coub: true,
                                codepen: true,
                                imgur: true,
                                gfycat: true,
                                twitchvideo: true,
                                vimeo: true,
                                vine: true,
                                twitter: true,
                                instagram: true,
                                aparat: true,
                                facebook: true,
                                pinterest: true,
                            }
                        },
                    },
                    image: SimpleImage,
                },
                data: data
            });

            // Move the editor inside the 
            this.editor.isReady
                .then(() => {
                    /** Do anything you need after editor initialization */
                    this.editorDiv.querySelector(".codex-editor__redactor").style.paddingBottom = "0px";
                    this.shadowRoot.querySelector("#edit-comment-content").style.display = "flex"
                })
                .catch((reason) => {
                    ApplicationView.displayMessage(`Editor.js initialization failed because of ${reason}`, 3000)
                });
        }

        // Publish the comment
        let publishCommentButton = this.shadowRoot.querySelector("#publish-blog-comment")
        publishCommentButton.onclick = () => {
            this.editor.save().then((outputData) => {

                generatePeerToken(this.globule, token => {
                    let rqst = new AddCommentRequest
                    let comment = new Comment
                    rqst.setUuid(this.blog.getUuid())
                    comment.setAccountId(Application.account.getId() + "@" + Application.account.getDomain())
                    comment.setLanguage(navigator.language.split("-")[0])
                    comment.setText(JSON.stringify(outputData))
                    comment.setParent(this.blog.getUuid())
                    if (this.comment != undefined) {
                        comment.setParent(this.comment.getUuid())
                    }
                    rqst.setComment(comment)

                    this.globule.blogService.addComment(rqst, { domain: Model.domain, application: Model.application, address: Model.address, token: token })
                        .then(rsp => {
                            this.globule.eventHub.publish("new_" + comment.getParent() + "_comment_evt", rsp.getComment().serializeBinary(), false)
                            addCommentBtn.style.display = "flex"
                            this.editDiv.style.display = "none"
                            this.removeChild(this.editorDiv)
                        })
                }, err => ApplicationView.displayMessage(err, 3000))


            })
        }

        let cancelCommentButton = this.shadowRoot.querySelector('#cancel-blog-comment')
        cancelCommentButton.onclick = () => {
            addCommentBtn.style.display = "flex"
            this.collapse_panel.style.display = ""
            this.editDiv.style.display = "none"
            this.removeChild(this.editorDiv)
        }

    }

    connectedCallback() {
    }

    setBlog(blog) {
        this.blog = blog
    }

    setComment(comment) {
        this.comment = comment
    }
}

customElements.define('globular-blog-comment-editor', BlogCommentEditor)



/**
 * Emotion it's all what the life is about after all...
 */
export class BlogEmotions extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(blog, comment) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
           
            #container{
                display: flex;
            }
        </style>
        <div id="container">
            <slot></slot>
        </div>
        `

        // test create offer...
        this.blog = blog
        this.comment = comment

        if (this.comment != undefined) {
            // In that case the emotion is related to the comment and not the blog.
            this.setComment(comment)
        } else if (blog != undefined) {
            // The emotion is related to the blog.
            this.setBlog(blog)
        }
    }

    addEmotion(emotion) {
        // Here I will add the emotion into the the panel...
        let emoji = JSON.parse(emotion.getEmoji())
        let uuid = "_" + getUuidByString(emoji.emoji.annotation)
        let emojiDiv = this.querySelector("#" + uuid)

        if (emojiDiv == null) {
            // Here I will create the emoji panel...
            let html = `
            <div id="${uuid}" class="blog-emitions" style="position: relative;">
                ${emoji.unicode}
                <paper-card style="background-color: var(--palette-background-paper); color: var(--palette-text-primary); z-index: 100; display: none; flex-direction: column; position: absolute; top: 30px; left: 15px;">
                    <div class="emotion-title">${emoji.emoji.annotation}</div>
                    <div class="emotion-peoples"> </div>
                </paper-card>
            </div>
            `
            this.appendChild(document.createRange().createContextualFragment(html))
            emojiDiv = this.querySelector("#" + uuid)

            // The list of pepoel who give that emotion
            emojiDiv.accounts = []

            emojiDiv.onmouseenter = () => {
                emojiDiv.querySelector("paper-card").style.display = "flex"
            }

            emojiDiv.onmouseleave = () => {
                emojiDiv.querySelector("paper-card").style.display = "none"
            }
        }

        // Now I will append the account id in the emotion...
        if (emojiDiv.accounts != null) {
            if (emojiDiv.accounts.indexOf(emotion.authorId) == -1) {
                // TODO append the account to the display...
                Account.getAccount(emotion.getAccountId(), a => {
                    let pepoleDiv = emojiDiv.querySelector(".emotion-peoples")
                    let span = document.createElement("span")
                    let userName = a.name
                    uuid = "_" + getUuidByString(emoji.emoji.annotation + a.name)
                    if (pepoleDiv.querySelector("#" + uuid) != undefined) {
                        return
                    }

                    if (a.firstName.length > 0) {
                        userName = a.firstName + " " + a.lastName
                    }

                    span.id = uuid
                    span.innerHTML = userName
                    pepoleDiv.appendChild(span)

                }, e => { console.log(e) })
            }
        }
    }

    connectedCallback() {

    }

    // If the parent is a blog.
    setBlog(blog) {

        this.blog = blog
        if (this.comment == undefined) {
            this.blog.getEmotionsList().forEach(emotion => {
                this.addEmotion(emotion)
            })

            // Now I will connect emotion event...
            Model.getGlobule(blog.getDomain()).eventHub.subscribe(blog.getUuid() + "_new_emotion_event", uuid => { }, evt => {
                let emotion = Emoji.deserializeBinary(Uint8Array.from(evt.split(",")))

                Account.getAccount(emotion.getAccountId(), a => {
                    let userName = a.name
                    if (a.firstName.length > 0) {
                        userName = a.firstName + " " + a.lastName
                    }
                    let emoji = JSON.parse(emotion.getEmoji())
                    ApplicationView.displayMessage(`${userName} put emoji '${emoji.emoji.annotation}' ${emoji.unicode} to your <div style="padding-left: 5px;" onclick="document.getElementById('${blog.getUuid()}').scrollIntoView();">blog</div>`, 3000)
                }, e => {
                    console.log(e)
                })


                this.addEmotion(emotion)
            }, false, this)
        }
    }

    // If the parent is a comment...
    setComment(comment) {
        this.comment = comment
        this.comment.getEmotionsList().forEach(emotion => {
            this.addEmotion(emotion)
        })
        // Now I will connect emotion event...
        Model.getGlobule(this.blog.getDomain()).eventHub.subscribe(comment.getUuid() + "_new_emotion_event", uuid => { }, evt => {
            let emotion = Emoji.deserializeBinary(Uint8Array.from(evt.split(",")))

            Account.getAccount(emotion.getAccountId(), a => {
                let userName = a.name
                if (a.firstName.length > 0) {
                    userName = a.firstName + " " + a.lastName
                }
                let emoji = JSON.parse(emotion.getEmoji())
                ApplicationView.displayMessage(`${userName} put emoji '${emoji.emoji.annotation}' ${emoji.unicode} to your <div style="padding-left: 5px;" onclick="document.getElementById('${comment.getUuid()}').scrollIntoView();">blog</div>`, 3000)
            }, e => {
                console.log(e)
            })


            this.addEmotion(emotion)
        }, false, this)
    }
}

customElements.define('globular-blog-emotions', BlogEmotions)


/**
 * Login/Register functionality.
 */
export class BlogEditingMenu extends Menu {

    // Create the application view.
    constructor() {
        super("blog-editing", "icons:speaker-notes", "Blog Editing")

        this.onclose = null;
        this.blogs = null;

        this.onclick = () => {
            let icon = this.getIconDiv().querySelector("iron-icon")
            icon.style.removeProperty("--iron-icon-fill-color")
            if (this.blogs.parentNode == undefined) {
                Model.eventHub.publish("_display_blogs_event_", this.blogs, true)
            }
        }

        // hide the menu div
        this.hideMenuDiv = true
    }

    init() {
        // The blog list...
        if (this.blogs == null) {
            const userName = localStorage.getItem("user_name");
            const userDomain = localStorage.getItem("user_domain");
            let blogs = new BlogPosts(userName + "@" + userDomain)
            blogs.onclose = this.onclose;

            ApplicationView.wait("Retreive Blogs </br>Please wait...")

            blogs.style.display = "none";
            blogs.onloaded = () => {
                ApplicationView.resume()
                blogs.style.display = "";
            }
            this.blogs = blogs;
        }

    }
}

customElements.define('globular-blog-editing-menu', BlogEditingMenu)