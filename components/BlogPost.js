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
import { BodyType } from 'globular-web-client/mail/mail_pb';
import { ConversationServicePromiseClient } from 'globular-web-client/conversation/conversation_grpc_web_pb';
import { ApplicationView } from '../ApplicationView';
import { CreateBlogPostRequest } from 'globular-web-client/blog/blog_pb';
import { Application } from '../Application';
import { Model } from '../Model';

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
            #container{
                display: flex;
                flex-direction: column;
                max-width: 650px;
                margin: 0 auto;
            }
            .blog-actions{
                display: flex;
                justify-content: flex-end;
                border-top: 1px solid var(--palette-background-paper);
            }
        </style>
        <div id="container">
           
            <slot></slot>
            
            <div class="blog-actions">
                <paper-button id="publish-blog">Plublish</paper-button>
                <paper-button>Delete</paper-button>
            <div>
        </div>
        `

        // publish the blog...
        this.shadowRoot.querySelector("#publish-blog").onclick = ()=>{
            this.publish()
        }

    }

    // Connection callback
    connectedCallback() {
        // Create the post editor.
        if(this.editor == null){
            this.createBlogPostEditor()
        }
    }

    createBlogPostEditor() {
        let div = document.createElement("div")
        div.id = "editorjs"
        div.style = "margin-top: 10px; min-height: 340px;"

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
    publish(){
        this.editor.save().then((outputData) => {
            console.log('Article data: ', outputData)
            let rqst = new CreateBlogPostRequest
            rqst.setAccountId(Application.account.id)
            rqst.setText(JSON.stringify(outputData));
            rqst.setLanguage(navigator.language)
            rqst.setTitle("")
            rqst.setKeywordsList(["test", "toto", "titi"])

            Model.globular.blogService.createBlogPost(rqst,  { domain: Model.domain, application: Model.application, token: localStorage.getItem("user_token") })
            .then(rsp =>{
                console.log("----------------> blog was created: ", rsp.getBlogPost())
            }).catch(e=>{
                ApplicationView.displayMessage(e, 3000)
            })

          }).catch((error) => {
            console.log('Saving failed: ', error)
            ApplicationView.displayMessage(`Saving failed: ${error}`, 3000)
          });
    }
}

customElements.define('globular-blog-post', BlogPost)