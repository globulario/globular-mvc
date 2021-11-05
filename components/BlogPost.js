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
import { CreateBlogPostRequest, GetBlogPostsByAuthorRequest, SaveBlogPostRequest } from 'globular-web-client/blog/blog_pb';
import { Application } from '../Application';
import { Model } from '../Model';
import * as edjsHTML from 'editorjs-html'
import { Account } from '../Account';
import { v4 as uuidv4 } from "uuid";

/**
 * Search Box
 */
export class BlogPost extends HTMLElement {
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
                max-width: 735px;
                position: relative;
                margin: 0px auto 20px;
            }

            #title {
                display: flex;
                border-bottom: 1px solid var(--palette-background-paper);
                padding: 4px;
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
                padding: 8px;
                text-align: center;
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
                        <div class="blog-actions" style="justify-content: end; border-color: var(--palette-background-paper);">
                            <paper-button style="align-self: end;" id="blog-editor-delete-btn">Delete</paper-button>
                        </div>
                    </paper-card>

                    <slot  id="edit-blog-content" name="edit-blog-content"></slot>
                    
                    <div class="blog-actions" style="background-color: transparent;">
                        <paper-radio-group selected="draft" style="flex-grow: 1;  text-align: left; font-size: 1rem;">
                            <paper-radio-button name="draft">draft</paper-radio-button>
                            <paper-radio-button name="published">published</paper-radio-button>
                            <paper-radio-button name="archived">archived</paper-radio-button>
                        </paper-radio-group>
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
                    <h1 id="blog-reader-title"></h1>
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
            </paper-card>
        </div>
        `

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
            this.shadowRoot.querySelector("#blog-options-panel").style.display = "none";
            this.titleSpan.innerHTML = ` ${Application.account.name}, express yourself`
            this.titleSpan.style.color = "var(--palette-action-disabled)"
        }

        // switch to edit mode...
        this.shadowRoot.querySelector("#blog-reader-edit-btn").onclick = () => {
            this.edit(() => {
                console.log("==-----------> ceci est un test...")
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
            }else{
                this.titleSpan.style.color = "var(--palette-action-disabled)"
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
        return div
    }

    /**
     * Display the blog in read mode.
     * @param {*} callbak 
     */
    read(callback) {
        this.shadowRoot.querySelector("#blog-post-editor-div").style.display = "none"
        this.shadowRoot.querySelector("#blog-post-reader-div").style.display = ""
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

customElements.define('globular-blog-post', BlogPost)


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
        if (this.getAttribute("author") != undefined) {
            this.getBlogPostsByAuthor(this.getAttribute("author"), blogs => {
                this.setBlogPosts(blogs)
            })
        }
    }

    // The list of blogs
    setBlogPosts(blogs) {
        blogs.sort((a, b) => { return b.getCreationtime() - a.getCreationtime() })
        blogs.forEach(b => {
            // This contain the 
            let blog = new BlogPost()
            blog.setBlog(b)

            // Generate the blog display and set in the list.
            blog.read(() => {
                this.appendChild(blog)
            })

        })
    }

    // display list of posts from a given author...
    getBlogPostsByAuthor(author, callback) {
        let rqst = new GetBlogPostsByAuthorRequest
        rqst.setAuthor(author)
        Model.globular.blogService.getBlogPostsByAuthor(rqst, { domain: Model.domain, application: Model.application, token: localStorage.getItem("user_token") })
            .then(rsp => {
                callback(rsp.getPostsList())
            })
            .catch(e => {
                ApplicationView.displayMessage(e, 3000)
            })
    }

}

customElements.define('globular-blog-posts', BlogPosts)