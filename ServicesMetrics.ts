import {
    CreateConnectionRqst,
    Connection,
    StoreType,
} from "globular-web-client/monitoring/monitoring_pb";
import { Model } from "./Model";
import { queryTsRange, queryTs } from "globular-web-client/api";


/**
 * Display server and services cpu, memory and network usage.
 */
export class ServicesMetrics {
    private gaugeDiv: any

    constructor(workspace: any) {
        let layout = `
      <div class="container"> 
        <div class="row"> 
          <div class="col s12 m12"> 
            <div class="card-panel" style="height: 200px">              
                    <div id="gauge_div"></div>
               </div>
            </div>
         </div> 
         
         <div class="row">
           <div class="col s12 m12" >  
            <div class="card-panel" style="height: 550px">       
              <div id="chart_div" style="width: 100%; height: 100%"></div>
           </div>     
         </div>
      </div>    
     </div>
     <div id="valueDiv"></div>
  
     <div class="container"> 
  
     </div>
  
      `
        let range = document.createRange()
        let fragment = range.createContextualFragment(layout)

        workspace.appendChild(fragment)
        this.gaugeDiv = document.getElementById("gauge_div")


    }

    init() {

        let drawGauge = () => {

            var data = google.visualization.arrayToDataTable([
                ['Label', 'Value'],
                ['Memory', 80],
                ['CPU', 55],
                ['Network', 68]
            ]);

            var options = {
                width: 400, height: 120,
                redFrom: 90, redTo: 100,
                yellowFrom: 75, yellowTo: 90,
                minorTicks: 5
            };

            var chart = new google.visualization.Gauge(this.gaugeDiv);

            chart.draw(data, options);

            setInterval(function () {
                data.setValue(0, 1, 40 + Math.round(60 * Math.random()));
                chart.draw(data, options);
            }, 13000);
            setInterval(function () {
                data.setValue(1, 1, 40 + Math.round(60 * Math.random()));
                chart.draw(data, options);
            }, 5000);
            setInterval(function () {
                data.setValue(2, 1, 60 + Math.round(20 * Math.random()));
                chart.draw(data, options);
            }, 26000);
        }


        function drawChart(series: any, values: any) {
            var data = new google.visualization.DataTable();
            data.addColumn('number', 'X');

            // append the series.
            series.forEach((serie: any) => {
                data.addColumn('number', serie);
            });

            data.addRows(values);

            var options = {
                hAxis: {
                    title: 'Time'
                },
                vAxis: {
                    title: 'Popularity'
                }
            };

            var chart = new google.visualization.LineChart(document.getElementById('chart_div'));

            chart.draw(data, options);
        }

        let getDataRange = (query: string, startTime: number, endTime: number, inc: number, callback: (series: any, values: any) => void) => {
            queryTsRange(
                Model.globular,
                "dashboard_connection",
                query,
                startTime / 1000,
                endTime / 1000,
                inc,
                (values: any) => {
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
                (err: any) => {
                    console.log(err)
                }
            );
        }


        // Draw the memory chart.
        let drawMemoryChart = (offset: number, inc: number) => {
            let endTime_ = new Date().getTime();
            let startTime_ = endTime_ - (offset);
            getDataRange("globular_services_memory_usage_counter", startTime_, endTime_, inc, (series: any, values: any) => {
                drawChart(series, values)
            })
        }

        google.charts.load('current', { 'packages': ['gauge'] }).then(() => {
            drawGauge()
            google.charts.load('current', { 'packages': ['corechart', 'line'] }).then(() => {
                google.charts.setOnLoadCallback(() => {
                    drawMemoryChart(60000 * 60, 60 * 1000)
                    // Set the resize event.
                    window.addEventListener('resize', () => {
                        drawMemoryChart(60000 * 60, 60 * 1000)
                    });
                });
            })
        });


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
            .catch((err: any) => {
                console.log(err);
            });
        //  queryTsRange(Model.globular, "")

        // Get a range from start to end time
        let endTime = new Date().getTime();
        let startTime = endTime - (1000);

        queryTs(
            Model.globular,
            "dashboard_connection",
            "globular_services_memory_usage_counter",
            endTime / 1000,
            (values: any) => {
                console.log(values)
            },
            (err: any) => {
                console.log(err)

            }
        );
    }
}