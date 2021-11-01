import { CreateConnectionRqst, Connection, StoreType,} from "globular-web-client/monitoring/monitoring_pb";
import { Model } from "../Model";
import { queryTsRange, queryTs } from "globular-web-client/api";
import { theme } from "./Theme";

export class MetricsDisplay extends HTMLElement {
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

        <div class="container"> 
          <div class="row"> 
            <div class="col s12 m12"> 
              <div class="card-panel" style="height: 300px">              
                      <div id="cpu-usage-div"></div>
                 </div>
              </div>
           </div> 
           
           <div class="row">
             <div class="col s12 m12" >  
              <div class="card-panel" style="height: 300px">       
                <div id="memory-history-div" style=""></div>
             </div>     
           </div>
        </div>    
       </div>
        `

        this.memoryHistoryDiv = document.getElementById("memory-history-div")
        this.cpuUsageDiv = document.getElementById("cpu-usage-div")
    }

    init() {

        // 
        let getDataRange = (query, startTime, endTime, inc, callback) => {
            queryTsRange(
                Model.globular,
                "dashboard_connection",
                query,
                startTime / 1000,
                endTime / 1000,
                inc,
                (values) => {
                    let values_ = []
                    let series_ = []

                    for (var i = 0; i < values.length; i++) {
                        series_.push(values[i].metric.name)
                        if (i == 0) {
                            values_ = values[i].values;
                            for (var j = 0; j < values_.length; j++) {
                                values_[j][1] = parseInt(values_[j][1])
                            }
                        } else {
                            for (var j = 0; j < values[i].values.length; j++) {
                                values_[j].push(parseInt(values[i].values[j][1]))
                            }
                        }
                    }

                    callback(series_, values_)
                },
                (err) => {
                    console.log(err)
                }
            );
        }


        //TODO create the connection once when the application is installed.
        let rqst = new CreateConnectionRqst();
        let info = new Connection();
        info.setId("dashboard_connection");
        info.setPort(9090);
        info.setStore(StoreType.PROMETHEUS);
        info.setHost("localhost");
        rqst.setConnection(info);
        Model.globular.monitoringService
            .createConnection(rqst, {
                application: Model.application,
                domain: Model.domain,
            })
            .then(() => {

            })
            .catch((err) => {
                console.log(err);
            });
        //  queryTsRange(Model.globular, "")

        // Get a range from start to end time
        /*let endTime = new Date().getTime();
        let startTime = endTime - (1000);
        queryTs(
            Model.globular,
            "dashboard_connection",
            "globular_services_memory_usage_counter",
            endTime / 1000,
            (values) => {
                console.log(values)
            },
            (err) => {
                console.log(err)
            }
        );*/
        let endTime = new Date().getTime();
        let startTime = endTime - (1000);

        getDataRange ( "globular_services_memory_usage_counter", startTime, endTime, 1, (series, values)=>{
            console.log(series)
            console.log(values)
        })
    }
}

customElements.define('globular-metrics-display', MetricsDisplay)