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
import * as html2canvas from 'html2canvas'
import * as edjsHTML from 'editorjs-html'
import { BodyType } from 'globular-web-client/mail/mail_pb';

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

            #title span {
                flex-grow: 1;
                color: var(--palette-action-disabled);
                text-align: left;
                padding: 8px;
            }

            #blog-options-panel{
                position: absolute;
                right: 0px;
                top: 50px;
                z-index: 100;
            }

            #blog-options-panel .card-content{
                min-width: 400px;
                padding: 0px 10px 0px 10px;
                display: flex;
                flex-direction: column;
            }
            

            #menu-btn{
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

        </style>
        <div id="container">
            <paper-card id="blog-post-editor-div">
                <div id="title">
                    <span id="blog-title-span">
                        ${Application.account.name}, express yourself
                    </span>
                    <paper-icon-button icon="icons:more-horiz" id="menu-btn"></paper-icon-button>
                </div>
                <paper-card id="blog-options-panel" style="display: none;">
                    <div style="display: flex; align-items: center;">
                        <div style="flex-grow: 1; padding: 5px;">
                            Options
                        </div>
                        <paper-icon-button id="cancel-btn" icon="close"></paper-icon-button>
                    </div>
                    <div class="card-content">
                        <paper-input id="blog-title-input" label="title"></paper-input>
                        <globular-string-list-setting id="keywords-list" name="keywords" description="keywords will be use by the search engine to retreive your blog."></globular-string-list-setting>
                    </div>
                    <div class="blog-actions" style="justify-content: end; border-color: #737373;">
                        <paper-button style="align-self: end;" id="blog-delete-btn">Delete</paper-button>
                    </div>
                </paper-card>
                <slot></slot>
                
                <div class="blog-actions" style="background-color: transparent;">
                    <paper-radio-group selected="draft" style="flex-grow: 1;  text-align: left; font-size: 1rem;">
                        <paper-radio-button name="draft">draft</paper-radio-button>
                        <paper-radio-button name="published">published</paper-radio-button>
                        <paper-radio-button name="archived">archived</paper-radio-button>
                    </paper-radio-group>
                    <paper-button id="publish-blog">Save</paper-button>
                </div>
            </paper-card>

            <globular-blog-post-lst id="blog-post-lst"></globular-blog-post-lst>

        </div>
        
        `

        // publish the blog...
        this.shadowRoot.querySelector("#publish-blog").onclick = () => {
            this.publish()
        }

        // Display the option panel.
        this.shadowRoot.querySelector("#menu-btn").onclick = () => {
            if (this.shadowRoot.querySelector("#blog-options-panel").style.display == "") {
                this.shadowRoot.querySelector("#blog-options-panel").style.display = "none";
            } else {
                this.shadowRoot.querySelector("#blog-options-panel").style.display = "";
            }
        }

        this.titleSpan = this.shadowRoot.querySelector("#blog-title-span")
        this.titleInput = this.shadowRoot.querySelector("#blog-title-input")
        this.keywordsEditList = this.shadowRoot.querySelector("#keywords-list")

        this.shadowRoot.querySelector("#cancel-btn").onclick = () => {
            this.shadowRoot.querySelector("#blog-options-panel").style.display = "none";
            if (this.titleInput.value.length > 0) {
                this.titleSpan.innerHTML = this.titleInput.value;
                this.titleSpan.style.color = "var(--palette-text-primary)"
            } else {
                this.titleSpan.innerHTML = ` ${Application.account.name}, express yourself`
                this.titleSpan.style.color = "var(--palette-action-disabled)"
            }
        }

        this.shadowRoot.querySelector("#blog-delete-btn").onclick = () => {
            this.shadowRoot.querySelector("#blog-options-panel").style.display = "none";
            this.titleSpan.innerHTML = ` ${Application.account.name}, express yourself`
            this.titleSpan.style.color = "var(--palette-action-disabled)"
        }

    }

    // Connection callback
    connectedCallback() {
        // Create the post editor.
        if (this.editor == null) {
            this.createBlogPostEditor()

            // Here i will get the list of post.
            this.getBlogPostsByAuthor(posts => {
                this.shadowRoot.querySelector("#blog-post-lst").setBlogPosts(posts)
            })
        }
    }

    // display list of posts...
    getBlogPostsByAuthor(callback) {
        let rqst = new GetBlogPostsByAuthorRequest
        rqst.setAuthor(Application.account.id)
        Model.globular.blogService.getBlogPostsByAuthor(rqst, { domain: Model.domain, application: Model.application, token: localStorage.getItem("user_token") })
            .then(rsp => {
                callback(rsp.getPostsList())
            })
            .catch(e => {
                ApplicationView.displayMessage(e, 3000)
            })

    }

    createBlogPostEditor() {
        let div = document.createElement("div")
        div.id = "editorjs"
        div.style = "margin: 10px;"

        this.appendChild(div)

        // Here I will create the editor...
        // Here I will create a new editor...
        this.editor = new EditorJS({
            holder: div.id,
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
            }
        }
        );

        // Move the editor inside the 
        this.editor.isReady
            .then(() => {
                console.log('Editor.js is ready to work!')
                /** Do anything you need after editor initialization */
                div.querySelector(".codex-editor__redactor").style.paddingBottom = "0px";
            })
            .catch((reason) => {
                ApplicationView.displayMessage(`Editor.js initialization failed because of ${reason}`, 3000)
            });


    }
    /**
     * Save the blog and publish it...
     */
    publish() {
        this.editor.save().then((outputData) => {
            
            if (this.blogPost == null) {
                let rqst = new CreateBlogPostRequest
                rqst.setAccountId(Application.account.id)
                rqst.setText(JSON.stringify(outputData));
                rqst.setLanguage(navigator.language.split("-")[0])
                rqst.setTitle(this.titleInput.value)
                rqst.setKeywordsList(this.keywordsEditList.getValues())
                rqst.setThumbnail("")

                Model.globular.blogService.createBlogPost(rqst, { domain: Model.domain, application: Model.application, token: localStorage.getItem("user_token") })
                    .then(rsp => {
                        this.blogPost = rsp.getBlogPost();
                        ApplicationView.displayMessage("Your post is published!", 3000)
                    }).catch(e => {
                        ApplicationView.displayMessage(e, 3000)
                    })
            } else {

                let rqst = new SaveBlogPostRequest
                this.blogPost.setText(JSON.stringify(outputData))
                this.blogPost.setThumbnail(image)
                this.blogPost.setLanguage(navigator.language.split("-")[0])
                this.blogPost.setTitle(this.titleInput.value)
                this.blogPost.setKeywordsList(this.keywordsEditList.getValues())

                rqst.setBlogPost(this.blogPost)
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
export class BlogPostList extends HTMLElement {
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
            </div>
        </div>
        `

    }

    setBlogPosts(blogs) {
        blogs.sort((a, b)=>{return b.getCreationtime() - a.getCreationtime()})
        blogs.forEach(blog => {
            // This contain the 
            let div = this.toHtml(blog)
            this.shadowRoot.querySelector("#blog-lst-div").appendChild(div)
        })
    }

    /**
     * Take the editor content and create an html block form it...
     * @param {*} callbak 
     */
    toHtml(blog) {
        const edjsParser = edjsHTML();
        // So here I will get the plain html from the output json data.
        let elements = edjsParser.parse(JSON.parse(blog.getText()));
        let html = ""
        elements.forEach(e => {
            html += e
        });

        var div = document.createElement('paper-card');
        div.className = "blog-preview-div"
        div.innerHTML = html.trim();

        return div
    }
}

customElements.define('globular-blog-post-lst', BlogPostList)