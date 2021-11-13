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
import LinkTool from '@editorjs/link'
import { theme } from "./Theme";
import { ApplicationView } from '../ApplicationView';
import { CreateBlogPostRequest, GetBlogPostsByAuthorsRequest, SaveBlogPostRequest, BlogPost, DeleteBlogPostRequest, AddEmojiRequest, Emoji, AddCommentRequest, Comment } from 'globular-web-client/blog/blog_pb';
import { Application } from '../Application';
import { Model } from '../Model';
import * as edjsHTML from 'editorjs-html'
import { Account } from '../Account';
import { v4 as uuidv4 } from "uuid";
import '@polymer/iron-icons/communication-icons'
import { Database, Picker } from 'emoji-picker-element'
import { GetThumbnailsResponse } from 'globular-web-client/file/file_pb';
import * as getUuidByString from 'uuid-by-string';
import { localToGlobal } from './utility';

/**
 * Search Box
 */
export class BlogPostElement extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}

            #container {
                padding-top: 10px;
                padding-bottom: 10px;
            }

            #blog-post-editor-div{
                display: flex;
                flex-direction: column;
                max-width: 755px;
                position: relative;
                margin: 0px auto 20px;
            }

            #title {
                display: flex;
                border-bottom: 1px solid var(--palette-background-paper);
                padding: 4px;
                padding-left: 16px;
                align-items: center;
                background-color: transparent;
            }

            #blog-editor-title {
                flex-grow: 1;
                color: var(--palette-action-disabled);
                text-align: left;
                padding: 8px;
            }

            #blog-reader-title{
                flex-grow: 1;
                text-align: left;
                margin-left: 16px;
                padding: 8px;
            }

            .blog-options-panel{
                position: absolute;
                right: 0px;
                z-index: 100;
                background-color: var(--palette-background-default);
            }

            .blog-options-panel .card-content{
                min-width: 400px;
                padding: 0px 10px 0px 10px;
                display: flex;
                flex-direction: column;

            }

            .blog-actions{
                display: flex;
                border-top: 1px solid var(--palette-background-paper);
                align-items: center;
            }

            globular-string-list-setting {
                padding-left: 0px;
                padding-rigth: 0px;
            }

            .blog-post-reader-div{
                position: relative;
            }

        </style>

        <div id="container">
            
            <paper-card id="blog-post-editor-div">
                <div id="title">
                    <div style="display: flex; width: 32px; height: 32px; justify-content: center; align-items: center;position: relative;">
                        <iron-icon  id="collapse-btn"  icon="unfold-less" --iron-icon-fill-color:var(--palette-text-primary);"></iron-icon>
                        <paper-ripple class="circle" recenters=""></paper-ripple>
                    </div>
                    <span id="blog-editor-title">
                        ${Application.account.name}, express yourself
                    </span>
                    <paper-icon-button icon="icons:more-horiz" id="blog-editor-menu-btn"></paper-icon-button>
                </div>
                <iron-collapse opened = "[[opened]]" id="collapse-panel" style="display: flex; flex-direction: column;">
                    
                    <paper-card id="blog-editor-options-panel" class="blog-options-panel" style="display: none;">
                        <div class="card-content" style="background-color: transparent;">
                            <paper-input id="blog-title-input" label="title"></paper-input>
                            <globular-string-list-setting id="keywords-list" name="keywords" description="keywords will be use by the search engine to retreive your blog."></globular-string-list-setting>
                        </div>
                    </paper-card>

                    <slot  id="edit-blog-content" name="edit-blog-content"></slot>
                    
                    <div class="blog-actions" style="background-color: transparent;">
                        <paper-radio-group selected="draft" style="flex-grow: 1;  text-align: left; font-size: 1rem;">
                            <paper-radio-button name="draft">draft</paper-radio-button>
                            <paper-radio-button name="published">published</paper-radio-button>
                            <paper-radio-button name="archived">archived</paper-radio-button>
                        </paper-radio-group>
                        <paper-button style="align-self: end;" id="blog-editor-delete-btn">Delete</paper-button>
                        <paper-button id="publish-blog">Save</paper-button>
                    </div>
                </iron-collapse>

            </paper-card>
            <paper-card id="blog-post-reader-div">
                <div id="title">
                    <div style="display: flex; flex-direction: column; padding-left: 5px;">
                        <div>
                            <img id="blog-reader-author-picture" style="width: 32px; height: 32px; border-radius: 16px; display:none;"></img>
                            <iron-icon id="blog-reader-author-icon"  icon="account-circle" style="width: 34px; height: 34px; --iron-icon-fill-color:var(--palette-action-disabled); display: block;"></iron-icon>
                        </div>
                        <span  id="blog-reader-author-id"></span>
                    </div>
                    <h2 id="blog-reader-title"></h2>
                    <paper-icon-button icon="icons:more-horiz" id="blog-reader-menu-btn"></paper-icon-button>
                </div>
                <paper-card id="blog-reader-options-panel"  class="blog-options-panel"  style="display: none;">
                    <div class="card-content" style="background-color: transparent;">
                        
                    </div>
                    <div class="blog-actions" style="justify-content: end; border-color: var(--palette-background-paper);">
                        <paper-button style="align-self: end;" id="blog-reader-edit-btn">Edit</paper-button>
                    </div>
                </paper-card>
                <slot id="read-only-blog-content" name="read-only-blog-content"></slot>
                <slot name="blog-comments"></slot>
            </paper-card>
        </div>
        `

        // The comments container...
        this.blogComments = new BlogComments()
        this.blogComments.slot = "blog-comments"
        this.appendChild(this.blogComments)

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
        this.shadowRoot.querySelector("#publish-blog").onclick = () => {
            this.publish()
        }

        // Display the option panel.
        this.shadowRoot.querySelector("#blog-editor-menu-btn").onclick = () => {
            let optionPanel = this.shadowRoot.querySelector("#blog-editor-options-panel")
            if (optionPanel.style.display == "") {
                optionPanel.style.display = "none";
            } else {
                optionPanel.style.display = "";
                optionPanel.style.top = optionPanel.parentNode.offsetHeigt / 2 + "px"
            }

            if (this.titleInput.value.length > 0) {
                this.titleSpan.innerHTML = this.titleInput.value;
                this.titleSpan.style.color = "var(--palette-text-primary)"
            } else {
                this.titleSpan.innerHTML = ` ${Application.account.name}, express yourself`
                this.titleSpan.style.color = "var(--palette-action-disabled)"
            }
        }

        this.shadowRoot.querySelector("#blog-reader-menu-btn").onclick = () => {
            let optionPanel = this.shadowRoot.querySelector("#blog-reader-options-panel")

            if (optionPanel.style.display == "") {
                optionPanel.style.display = "none";
            } else {
                optionPanel.style.display = "";
                optionPanel.style.top = optionPanel.parentNode.offsetHeigt / 2 + "px"
            }

        }

        // The editor values.
        this.titleSpan = this.shadowRoot.querySelector("#blog-editor-title")
        this.titleInput = this.shadowRoot.querySelector("#blog-title-input")
        this.keywordsEditList = this.shadowRoot.querySelector("#keywords-list")

        this.shadowRoot.querySelector("#blog-editor-delete-btn").onclick = () => {
            let rqst = new DeleteBlogPostRequest
            rqst.setUuid(this.blog.getUuid())

            // Delete the blog...
            Model.globular.blogService.deleteBlogPost(rqst, { domain: Model.domain, application: Model.application, token: localStorage.getItem("user_token") })
                .then(rsp => {
                    Model.eventHub.publish(this.blog.getUuid() + "_blog_delete_event", {}, false)
                })
                .catch(e => ApplicationView.displayMessage(e, 3000))
        }

        // switch to edit mode...
        this.shadowRoot.querySelector("#blog-reader-edit-btn").onclick = () => {
            this.edit(() => {
                ApplicationView.displayMessage("you'r in edit mode, click save to exit...", 3000)
            })
        }
    }

    // Connection callback
    connectedCallback() {
        // If the blog editor is set to true...
        if (this.getAttribute("editable") != undefined) {
            if (this.getAttribute("editable") == "true") {
                this.edit(() => {
                    console.log("editor is ready!")
                })
            }
        }
    }

    // Set the blog...
    setBlog(blog) {

        this.blog = blog;

        this.blogComments.setBlog(blog)

        if (this.blog.getAuthor() != Application.account.id) {
            let editBtn = this.shadowRoot.querySelector("#blog-reader-edit-btn")
            editBtn.parentNode.removeChild(editBtn)
        }

        if (this.updateListener == undefined) {
            Model.eventHub.subscribe(this.blog.getUuid() + "_blog_updated_event", uuid => this.updateListener = uuid, evt => {

                this.blog = BlogPost.deserializeBinary(Uint8Array.from(evt.split(",")))
                this.read(() => {
                    // set back values.
                    this.titleSpan.value = this.blog.getTitle()
                    this.titleInput.value = this.blog.getTitle()
                    this.keywordsEditList.setValues(this.blog.getKeywordsList())
                })
            }, false, this)
        }

        if (this.deleteListener == undefined) {
            Model.eventHub.subscribe(this.blog.getUuid() + "_blog_delete_event", uuid => this.updateListener = uuid,
                evt => {
                    // simplity remove it from it parent...
                    this.parentNode.removeChild(this)
                }, false, this)
        }

        // Here I will set the blog various information...
        let authorIdSpan = this.shadowRoot.querySelector("#blog-reader-author-id")
        authorIdSpan.innerHTML = blog.getAuthor()

        Account.getAccount(blog.getAuthor(), a => {
            let img = this.shadowRoot.querySelector("#blog-reader-author-picture")
            let ico = this.shadowRoot.querySelector("#blog-reader-author-icon")
            if (a.profilPicture_ != undefined) {
                img.src = a.profilPicture_
                img.style.display = "block"
                ico.style.display = "none"
            }

        }, e => { })

        this.shadowRoot.querySelector("#blog-reader-title").innerHTML = blog.getTitle()

        this.titleSpan.value = blog.getTitle()
        this.titleInput.value = blog.getTitle()
        this.keywordsEditList.setValues(blog.getKeywordsList())
    }

    /**
     * Display the blog in edit mode.
     * @param {*} callback 
     */
    edit(callback) {


        // Show the paper-card where the blog will be display
        this.shadowRoot.querySelector("#blog-post-editor-div").style.display = ""
        this.shadowRoot.querySelector("#blog-post-reader-div").style.display = "none"

        if (this.editorDiv != null) {
            callback(this.editorDiv)

            return
        }

        this.editorDiv = document.createElement("div")
        this.editorDiv.id = "_" + uuidv4() + "editorjs"
        this.editorDiv.slot = "edit-blog-content"
        this.editorDiv.style = "margin: 10px; min-height: 230px;"
        this.appendChild(this.editorDiv)

        let data = {}
        if (this.blog != undefined) {
            data = JSON.parse(this.blog.getText())
            if (this.blog.getTitle().length > 0) {
                this.titleSpan.innerHTML = this.blog.getTitle()
                this.titleInput.value = this.blog.getTitle()
                this.titleSpan.style.color = "var(--palette-text-primary)"
            } else {
                this.titleSpan.style.color = "var(--palette-action-disabled)"
            }


            if (this.blog.getAuthor() != Application.account.id) {
                ApplicationView.displayMessage("your not allowed to edit ", this.blog.getAuthor(), " post!", 3000)
                return
            }

            this.keywordsEditList.setValues(this.blog.getKeywordsList())
        }

        // Here I will create the editor...
        // Here I will create a new editor...
        this.editor = new EditorJS({
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
            },
            data: data
        });

        // Move the editor inside the 
        this.editor.isReady
            .then(() => {
                /** Do anything you need after editor initialization */
                this.editorDiv.querySelector(".codex-editor__redactor").style.paddingBottom = "0px";
                console.log("editor is ready")
                /** done with the editor initialisation */
                callback()

            })
            .catch((reason) => {
                ApplicationView.displayMessage(`Editor.js initialization failed because of ${reason}`, 3000)
            });

    }

    // Get the image default size...
    getMeta(url, callback) {
        const img = new Image();
        img.addEventListener("load", () => {
            callback({ width: img.naturalWidth, height: img.naturalHeight });
        });
        img.src = url;
    }

    // generate html from json data
    jsonToHtml(data) {
        // So here I will get the plain html from the output json data.
        const edjsParser = edjsHTML();
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

            this.getMeta(img.src, meta => {
                if (meta.width < div.offsetWidth && meta.height < div.offsetHeight) {
                    img.style.width = meta.width + "px"
                    img.style.height = meta.height + "px"
                }
            })

        })

        return div
    }

    /**
     * Display the blog in read mode.
     * @param {*} callbak 
     */
    read(callback) {
        this.shadowRoot.querySelector("#blog-post-editor-div").style.display = "none"
        this.shadowRoot.querySelector("#blog-post-reader-div").style.display = ""

        // Here I will replace existing elements with new one...
        let elements = this.querySelectorAll(`[slot="read-only-blog-content"]`)
        for (var i = 0; i < elements.length; i++) {
            this.removeChild(elements[i])
        }

        if (this.editor != null) {
            this.editor.save().then((outputData) => {
                let div = this.jsonToHtml(outputData)
                this.appendChild(div)
                callback()
            })
        } else {
            let div = this.jsonToHtml(JSON.parse(this.blog.getText()))
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
                let rqst = new CreateBlogPostRequest
                rqst.setAccountId(Application.account.id)
                rqst.setText(JSON.stringify(outputData));
                rqst.setLanguage(navigator.language.split("-")[0])
                rqst.setTitle(this.titleInput.value)
                rqst.setKeywordsList(this.keywordsEditList.getValues())
                rqst.setThumbnail("")

                Model.globular.blogService.createBlogPost(rqst, { domain: Model.domain, application: Model.application, token: localStorage.getItem("user_token") })
                    .then(rsp => {
                        this.blog = rsp.getBlogPost();
                        ApplicationView.displayMessage("Your post is published!", 3000)
                        // Publish the event
                        Model.eventHub.publish(Application.account.id + "_publish_blog_event", this.blog.serializeBinary(), false)
                        this.clear()

                    }).catch(e => {
                        ApplicationView.displayMessage(e, 3000)
                    })
            } else {

                let rqst = new SaveBlogPostRequest
                this.blog.setText(JSON.stringify(outputData))
                this.blog.setThumbnail(image)
                this.blog.setLanguage(navigator.language.split("-")[0])
                this.blog.setTitle(this.titleInput.value)
                this.blog.setKeywordsList(this.keywordsEditList.getValues())

                rqst.setBlogPost(this.blog)
                Model.globular.blogService.saveBlogPost(rqst, { domain: Model.domain, application: Model.application, token: localStorage.getItem("user_token") })
                    .then(rsp => {
                        ApplicationView.displayMessage("Your post was updated!", 3000)

                        // That function will update the blog...
                        Model.eventHub.publish(this.blog.getUuid() + "_blog_updated_event", this.blog.serializeBinary(), false)

                    }).catch(e => {
                        ApplicationView.displayMessage(e, 3000)
                    })
            }

        }).catch((error) => {
            console.log('Saving failed: ', error)
            ApplicationView.displayMessage(`Saving failed: ${error}`, 3000)
        });
    }
}

customElements.define('globular-blog-post', BlogPostElement)


/**
 * Display globular blog list.
 */
export class BlogPosts extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}
        </style>
        <div id="container">
            <div id="blog-lst-div">
                <slot></slot>
            </div>
        </div>
        `
    }

    connectedCallback() {
        // If the blog editor is set to true...
        let authors = []
        if (this.getAttribute("account") != undefined) {
            Account.getAccount(this.getAttribute("account"),
                account => {
                    // Subcribe to my own blog create event...
                    Model.eventHub.subscribe(account.id + "_publish_blog_event", uuid => this[account.id + "_publish_blog_listener"] = uuid,
                        evt => {
                            // Get the date from the event and create the newly
                            this.setBlog(BlogPost.deserializeBinary(Uint8Array.from(evt.split(","))), true)
                        }, false, this)

                    authors.push(account.id)

                    Account.getContacts(account, "{}", contacts => {
                        if (contacts.length == 0) {
                            this.getBlogs(authors, blogs => {
                                this.setBlogPosts(blogs)
                            })
                            return
                        }
                        let index = 0;
                        contacts.forEach(contact => {
                            Model.eventHub.subscribe(contact._id + "_publish_blog_event", uuid => this[contact._id + "_publish_blog_listener"] = uuid,
                                evt => {
                                    // Get the date from the event and create the newly
                                    this.setBlog(BlogPost.deserializeBinary(Uint8Array.from(evt.split(","))), true)
                                }, false, this)

                            authors.push(contact._id)
                            if (index == contacts.length - 1) {
                                this.getBlogs(authors, blogs => {
                                    this.setBlogPosts(blogs)
                                })
                            }

                            index++
                        })
                    }, err => ApplicationView.displayMessage(err, 3000))
                })
        }
    }

    // Get the list of blogs.
    getBlogs(authors, callback) {

        let rqst = new GetBlogPostsByAuthorsRequest
        rqst.setAuthorsList(authors)
        rqst.setMax(100)

        let stream = Model.globular.blogService.getBlogPostsByAuthors(rqst, { domain: Model.domain, application: Model.application, token: localStorage.getItem("user_token") });
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
    }

    setBlog(b, prepend = false) {
        if (this.querySelector("_" + b.getUuid()) != undefined) {
            // not append the blog twice...
            return
        }

        let blog = new BlogPostElement()
        blog.id = "_" + b.getUuid()
        blog.setBlog(b)

        // Generate the blog display and set in the list.
        blog.read(() => {
            if (prepend) {
                this.prepend(blog)
            } else {
                this.appendChild(blog)
            }

        })
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
    constructor(blog) {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}
        </style>
        <div>
            <slot name="blog-emotions"> </slot>
            <slot name="blog-comment-editor"></slot>
            <slot name="blog-comments"></slot>
        </div>
        `

        // The emotions 
        this.emotions = new BlogEmotions()
        this.emotions.slot = "blog-emotions"
        this.appendChild(this.emotions)

        // The comment editior
        this.editor = new BlogCommentEditor(blog)
        this.editor.slot = "blog-comment-editor"
        this.appendChild(this.editor)


    }

    setBlog(blog) {
        this.blog = blog
        this.editor.setBlog(blog)
        this.emotions.setBlog(blog)
        // Here I will connect the event channel for comment.
        Model.eventHub.subscribe("new_blog_" + this.blog.getUuid() + "_comment_evt",
            uuid => this["new_blog_" + this.blog.getUuid() + "_comment_listener"] = uuid,
            evt => {
                let comment = Comment.deserializeBinary(Uint8Array.from(evt.split(",")))
               
                this.setComment(comment)
            }, false, this)

        // Display the comment...
        this.blog.getCommentsList().forEach(c=>{
            this.setComment(c)
        })
    }

    // Append a new comment into the list of comment.
    setComment(comment) {
        console.log("--------------> comment ", comment)
    }
}

customElements.define('globular-blog-comments', BlogComments)

/**
 * Comments
 */
export class BlogComment extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}
        </style>
        <div>
        </div>
        `
    }

}

customElements.define('globular-blog-comment', BlogComment)

/**
 * Comments
 */
export class BlogCommentEditor extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor(blog) {
        super()

        this.blog = blog

        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}

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
        <div style="display: flex; flex-direction: column; position: relative; padding: 10px; padding-left:50px;">
            <div style="position: absolute; left:8px; top:16px;">
                <img id="blog-comment-editor-author-picture" style="width: 32px; height: 32px; border-radius: 16px; display:none;"></img>
                <iron-icon id="blog-comment-editor-author-icon"  icon="account-circle" style="width: 34px; height: 34px; --iron-icon-fill-color:var(--palette-action-disabled); display: block;"></iron-icon>
            </div>
            <div class="add-comment-btn" style="display: flex;">
                <div style="border-bottom: 1px solid var(--palette-action-disabled); min-width: 200px; margin-right: 5px;">
                    <iron-icon  style="width: 16px; height: 16px; --iron-icon-fill-color:var(--palette-action-disabled);" icon="add"></iron-icon>
                    <span>add comment</span> 
                    <paper-ripple recenters></paper-ripple>
                </div>
                <div>
                    <paper-icon-button id="collapse-btn" icon="editor:insert-emoticon" style="--iron-icon-fill-color:var(--palette-action-disabled);"></paper-icon-button>
                </div>
            </div>
            <div  style="display: flex; flex-direction: column; width: 100%;">
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
            console.log(event.detail); // will log something like the above
            this.collapse_btn.icon = "editor:insert-emoticon"
            this.collapse_panel.toggle();
            let rqst = new AddEmojiRequest
            let emoji = new Emoji
            emoji.setAccountId(Application.account.id)
            emoji.setEmoji(JSON.stringify(event.detail))
            emoji.setParent(this.blog.getUuid())
            rqst.setUuid(this.blog.getUuid())
            rqst.setEmoji(emoji)

            Model.globular.blogService.addEmoji(rqst, { domain: Model.domain, application: Model.application, token: localStorage.getItem("user_token") })
                .then(rsp => {
                    Model.eventHub.publish(this.blog.getUuid() + "_new_emotion_event", rsp.getEmoji().serializeBinary(), false)
                })
                .catch(e => {
                    ApplicationView.displayMessage(e, 3000)
                })

        });

        // Set the comment editior
        let addCommentBtn = this.shadowRoot.querySelector(".add-comment-btn")
        this.shadowRoot.querySelector("paper-ripple").ontransitionend = () => {
            addCommentBtn.style.display = "none"
            this.collapse_panel.style.display = "none"
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
                let rqst = new AddCommentRequest
                let comment = new Comment
                rqst.setUuid(this.blog.getUuid())
                comment.setAccountId(Application.account.id)
                comment.setLanguage(navigator.language.split("-")[0])
                comment.setText(JSON.stringify(outputData))
                rqst.setComment(comment)

                Model.globular.blogService.addComment(rqst, { domain: Model.domain, application: Model.application, token: localStorage.getItem("user_token") })
                    .then(rsp => {
                        Model.eventHub.publish("new_blog_" + this.blog.getUuid() + "_comment_evt", rsp.getComment().serializeBinary(), false)
                    })

            })
        }

    }



    connectedCallback() {
        Account.getAccount(Application.account.id, a => {
            let img = this.shadowRoot.querySelector("#blog-comment-editor-author-picture")
            let ico = this.shadowRoot.querySelector("#blog-comment-editor-author-icon")
            if (a.profilPicture_ != undefined) {
                img.src = a.profilPicture_
                img.style.display = "block"
                ico.style.display = "none"
            }

        }, e => { })
    }

    setBlog(blog) {
        this.blog = blog
    }
}

customElements.define('globular-blog-comment-editor', BlogCommentEditor)



/**
 * Emotion it's all what the life is about after all...
 */
export class BlogEmotions extends HTMLElement {
    // attributes.

    // Create the applicaiton view.
    constructor() {
        super()
        // Set the shadow dom.
        this.attachShadow({ mode: 'open' });

        // Innitialisation of the layout.
        this.shadowRoot.innerHTML = `
        <style>
            ${theme}
            #container{
                display: flex;
                padding: 10px
            }
        </style>
        <div id="container">
            <slot></slot>
        </div>
        `

        // test create offer...
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
                <paper-card style="z-index: 100; display: none; flex-direction: column; position: absolute; top: 30px; left: 15px;">
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

                }, e => { })
            }
        }
    }

    connectedCallback() {

    }

    // Set the blog...
    setBlog(blog) {
        this.blog = blog
        blog.getEmotionsList().forEach(emotion => {
            this.addEmotion(emotion)
        })

        // Now I will connect emotion event...
        Model.eventHub.subscribe(blog.getUuid() + "_new_emotion_event", uuid => { }, evt => {
            let emotion = Emoji.deserializeBinary(Uint8Array.from(evt.split(",")))

            Account.getAccount(emotion.getAccountId(), a => {
                let userName = a.name
                if (a.firstName.length > 0) {
                    userName = a.firstName + " " + a.lastName
                }
                let emoji = JSON.parse(emotion.getEmoji())
                ApplicationView.displayMessage(`${userName} put emoji '${emoji.emoji.annotation}' ${emoji.unicode} to your <div style="padding-left: 5px;" onclick="document.getElementById('${blog.getUuid()}').scrollIntoView();">blog</div>`, 3000)
            }, e => { })


            this.addEmotion(emotion)
        }, false, this)
    }

    // Set the comment...
    setComment(comment) {
        this.comment = comment
        this.comment.getEmotionsList().forEach(emotion => {
            this.addEmotion(emotion)
        })
    }
}

customElements.define('globular-blog-emotions', BlogEmotions)