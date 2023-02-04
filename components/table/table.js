// Polymer dependencies
import { PolymerElement, html } from "@polymer/polymer/polymer-element.js";

import { createElement } from "../element.js";
import { fireResize, isString, exportToCsv, getCoords } from "../utility.js";
import './header.js'; // The maximum allowed number of row for a grid.
import { DropdownMenu, DropdownMenuItem} from "../dropdownMenu.js";

var maxRowNumber = 1000;
var lastWidth = 0;

export class TableElement extends PolymerElement {
  constructor() {
    super();
    this.rowheight = -1; // in pixels

    this.index = -1;

    this.scrollDiv = null;

    // Some browsers limit the number of rows in a grid, therefore, multiple grids (named tiles) are used to display large tables
    this.tiles = [];

    this.sorters = [];
    this.filters = [];

    this.sorted = [];
    this.filtered = {};

    this.header = null;
    this.menu = null;
    this.hidefilter = true;

    // Cells are created once then recycled for optimization purposes
    this.cells = [];

    // Options for the observer (which mutations to observe)
    var config = {
      attributes: true,
      subtree: true
    };

    // Create an observer instance linked to a resize callback
    var observer = new MutationObserver((mutation) => {
      if (mutation[0].target.offsetWidth != lastWidth) {
        lastWidth = mutation[0].target.offsetWidth;
        fireResize();
      }
    });

    // Start observing the target node for configured mutations
    observer.observe(this, config);
  }

  /**
   * Internal component properties.
   */
  static get properties() {
    return {
      // array of data to display.
      data: Array,
      rowheight: Number,
      order: String,
      refresh: Function,
      onexport: Function,
      ondeleteall: Function,
      ondeletefiltered: Function,
      hidemenu: Boolean,
      width: String
    };
  }

  static get template() {
    let template = document.createElement("template")
    template.innerHTML = `
        <style>
       
            ::slotted(table-header-element) {

            }
        </style>
        <slot></slot>
    `;

    return template
  }

  /**
   * Creates all the grids (tiles) necessary to display the table
   */
  createTiles() {
    if (this.scrollDiv == null) {
      return null
    }

    this.scrollDiv.element.style.display = "";
    var size = 1;

    // Get the number of tiles necessary to populate the table
    if (this.size() > maxRowNumber) {
      size = Math.ceil(this.size() / maxRowNumber);
    }

    this.tiles = [];

    // Create the tiles as divs with a grid display style
    for (var i = 0; i < size; i++) {
      this.tiles[i] = this.scrollDiv.appendElement({
        "tag": "div",
        "class": "table-tile",
        "style": "grid-gap: 0px; display: grid;"
      }).down();

      // Set the number of rows equal to the number of rows in the header.
      var gridTemplateColumns = "";
      for (var j = 0; j < this.header.getSize(); j++) {
        var headerCell = this.header.getHeaderCell(j)
        gridTemplateColumns += headerCell.offsetWidth + "px"
        if (j < this.header.getSize() - 1) {
          gridTemplateColumns += " ";
        }
      }
      this.tiles[i].element.style.gridTemplateColumns = gridTemplateColumns;

      // CSS for the table's height
      if (i < size - 1 || this.size() % maxRowNumber == 0) {
        this.tiles[i].element.style.gridTemplateRows = "repeat( " + maxRowNumber + ", " + this.rowheight + "px)";
      } else {
        this.tiles[i].element.style.gridTemplateRows = "repeat( " + this.size() % maxRowNumber + ", " + this.rowheight + "px)";
      }
    }

    var resizeListener = function (tiles, header, table) {
      return function (entry) {

        var value = "";
        // Set the final header tile's margin to be slightly greater than the other margins so that there is space for the scrollbar
        var scrollBarWidth = table.scrollDiv.element.offsetWidth - table.scrollDiv.element.clientWidth;

        if (header.lastChild.style != null) {
          if (scrollBarWidth > 0) {
            if (header.children[header.children.length - 2].offsetWidth == header.lastChild.offsetWidth) {
              header.lastChild.style.marginRight = scrollBarWidth + "px";
            }
          } else {
            header.lastChild.style.marginRight = "";
          }
        }

        // Calculate the table's total width using the header as a baseline
        var totalWidth = 0;

        for (var i = 0; i < header.children.length; i++) {
          value += header.children[i].getBoundingClientRect().width + "px";
          totalWidth += header.children[i].getBoundingClientRect().width;

          if (i < header.children.length - 1) {
            value += " ";
          }
        }

        if (totalWidth == 0) {
          return;
        }

        // Set the table's overall width
        if (table.width == undefined) {
          table.style.width = totalWidth + "px";
          table.width = totalWidth;
        }

        // Set each tiles' width
        for (var i = 0; i < tiles.length; i++) {
          tiles[i].element.style.gridTemplateColumns = value;
        }

        if (table.menu != undefined) {
          table.style.marginLeft = table.menu.offsetWidth + 4 + "px";
          table.menu.style.left = -1 * (table.menu.offsetWidth + 2) + "px";
        }
      };
    }(this.tiles, this.children[0], this);

    window.addEventListener("resize", resizeListener, true);
  }

  /**
   * Instantiates the cells variable following the Singleton principle.
   * 
   * Cells are the items within each tile. A tile is a container whereas the cell is the content.
   */
  createCells() {
    if (this.data.length == 0) {
      return;
    }
    this.cells = []

    var max = Math.ceil(this.clientHeight / this.rowheight);
    if (max == 0 && this.style.maxHeight != undefined) {
      max = Math.ceil(parseInt(this.style.maxHeight.replace("px", "")) / this.rowheight);
    }

    var rowsLength = this.data[0].length;
    for (var i = 0; i < max; i++) {
      for (var j = 0; j < rowsLength; j++) {
        var cell = document.createElement("div");
        cell.className = "table-item";
        var cellContent = document.createElement("div");
        cellContent.className = "table-item-value";
        cell.appendChild(cellContent); // keep the cell as element in the buffer.
        this.cells.push(createElement(cell));
      }
    }
  }

  /**
   * Gets the width of the screen excluding the scrollbar
   */
  getScrollWidth() {
    var scrollBarWidth = this.scrollDiv.element.offsetWidth - this.scrollDiv.element.clientWidth;
    return scrollBarWidth
  }

  /**
   * Returns the current row index.
   */
  getIndex() {
    var index = 0;
    if (this.scrollDiv != null) {
      if (this.scrollDiv.element.scrollTop != undefined) {
        index = parseInt(this.scrollDiv.element.scrollTop / this.rowheight);
      }
    }

    return index;
  }

  hasFilter() {
    return this.getFilters().length > 0;
  }

  /**
   * Render the table
   */
  render() {
    var index = this.getIndex();
    var values = this.getFilteredData();

    if (this.index != index) {
      this.index = index;

      // Remove the current content within a tile to make sure we have a blank slate.
      for (var i = 0; i < this.tiles.length; i++) {
        this.tiles[i].removeAllChilds();
      }

      // Represent the number of visible items to display, I round it to display entire row.
      var max = Math.ceil(this.clientHeight / this.rowheight);

      if (max == 0 && this.style.maxHeight != undefined) {
        max = Math.ceil(parseInt(this.style.maxHeight.replace("px", "")) / this.rowheight);
      }

      // create cells once.
      if (this.cells.length == 0) {
        this.createCells();
      }

      if (values.length > 0 && this.scrollDiv != undefined) {
        var scrollBarWidth = this.scrollDiv.element.offsetWidth - this.scrollDiv.element.clientWidth;

        for (var i = 0; i + this.index < values.length && i < max; i++) {
          // Get the visible tile.
          var tileIndex = parseInt((this.index + i) / maxRowNumber);
          var tile = this.tiles[tileIndex]; // now I will calculate the row index

          var rowIndex = this.index - maxRowNumber * tileIndex + i;
          var size = values[i].length;

          for (var j = 0; j < size; j++) {
            var renderFct = this.header.getHeaderCell(j).onrender;
            var cell = this.cells[i * this.getRowData(i).length + j];
            cell.element.style.gridRow = rowIndex + 1 + " / span 1";
            tile.element.appendChild(cell.element);
            var div = cell.element.children[0];
            var value = values[i + this.index][j];

            div.style = "";
            div.innerHTML = "";

            // Check if there is a valid render function
            if (renderFct == null) {
              if (value != undefined) {
                div.innerHTML = value.toString();
              }
            } else {
              var r = i + this.index;

              if (isString(renderFct)) {
                eval(renderFct + "(div , value, r, j)");
              } else {
                var r = i + this.index;

                if (isString(renderFct)) {
                  eval(renderFct + "(div , value, r, j)");
                } else {
                  renderFct(div, value, r, j); // row, col.
                }
              }

              if (j == size - 1) {
                if (scrollBarWidth > 0) {
                  cell.element.style.paddingRight = scrollBarWidth + "px";
                } else {
                  cell.element.style.paddingRight = "";
                }
              }
            }
          }
        }
      } else if (this.scrollDiv != undefined) {
        // hide the scroll div.
        this.scrollDiv.element.style.display = "none";
      }
    }
  }

  /**
   * Creates the table.
   * 
   * Called when the table is ready to be displayed.
   */
  ready() {
    super.ready();

    this.style.position = "relative";

    // Index the rows.
    for (var i = 0; i < this.data.length; i++) {
      // Keep the index in the row itself.
      this.data[i].index = i;
    }

    this.header = this.children[0];

    for (var i = 0; i < this.header.children.length; i++) {
      for (var j = 0; j < this.header.children[i].children.length; j++) {
        if (this.header.children[i].children[j].tagName == "TABLE-SORTER-ELEMENT") {
          var sorter = this.header.children[i].children[j];
          sorter.childSorter = null;

          if (sorter.state != undefined) {
            if (sorter.state != 0) {
              this.sorters[sorter.order - 1] = sorter;
            }
          }

          sorter.index = this.sorters.length;

          this.sorters.push(sorter);
        } else if (this.header.children[i].children[j].tagName == "TABLE-FILTER-ELEMENT") {
          var filter = this.header.children[i].children[j];
          filter.index = this.filters.length;
          this.filters.push(filter);
        }
      }

      // Set the data type.
      if (this.header.children[i].typename == undefined) {
        for (var j = 0; j < this.data.length; j++) {
          if (this.data[j][i] != null) {
            this.header.children[i].typename = typeof this.data[j][i];
            break;
          }
        }
      }
    }

    // Create the table dropdown menu.
    if (!this.hidemenu) {
      this.menu = new DropdownMenu("menu")

      this.menu.innerHTML =
        `
        <globular-dropdown-menu-item id="unorder-menu-item" icon="sort" text="remove all sorter"></globular-dropdown-menu-item>
        <globular-dropdown-menu-item  id="filter-menu-item" icon="filter-list" text="filtering" action="">
              <globular-dropdown-menu-item id="unfilter-menu-item" text="remove all filter"></globular-dropdown-menu-item>
              <globular-dropdown-menu-item id="filter-menu-items" separator="true" text=""; style="display: none">
              </globular-dropdown-menu-item>
        </globular-dropdown-menu-item>
        <globular-dropdown-menu-item separator="true" id="delete-filtered-menu-item" icon="delete" text="delete filtered"></globular-dropdown-menu-item>
        <globular-dropdown-menu-item  id="delete-all-data-menu-item" icon="delete" text="delete all"></globular-dropdown-menu-item>
        <globular-dropdown-menu-item  id="export-menu-item" icon="file-download" text="export"></globular-dropdown-menu-item>
      `

      // Append the element in the body so it will alway be visible.
      this.appendChild(this.menu);
      this.menu.style.position = "absolute";

      this.style.marginLeft = this.menu.offsetWidth + 4 + "px";
      this.menu.style.left = -1 * (this.menu.offsetWidth + 2) + "px";

      // Make the table resize on display.
      var intersectionObserver = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          //entries[0].target.refresh()
          fireResize();
        }
      }); // Set the observer on the menu itself.

      intersectionObserver.observe(this); // append in the body.

      if (this.onexport == undefined) {

        // export csv file by default.
        this.menu.querySelector("#export-menu-item").action = () => {
          // Here I will get the filtered data.
          if (Object.keys(this.filtered).length > 0) {
            exportToCsv("data.csv", Object.values(this.filtered));
          } else {
            exportToCsv("data.csv", this.data);
          }
        };
      } // Remove the ordering

      this.menu.querySelector("#unorder-menu-item").action = () => {
        for (var i = 0; i < this.sorters.length; i++) {
          var sorter = this.sorters[i];
          sorter.childSorter = null;
          sorter.state = undefined;
          sorter.unset();
        } // sort the table.

        this.sort();
        this.refresh(); // refresh the result.
      }


      this.menu.querySelector("#unfilter-menu-item").action = () => {

        // Now I will remove all filters...
        for (var i = 0; i < this.filters.length; i++) {
          if (this.filters[i].filter != null) {
            if (this.filters[i].filter.expressions.length > 0 || this.filters[i].filter.filters.length > 0) {
              this.filters[i].filter.clear();
            }
          }
        }

        this.filter();
        this.refresh(); // refresh the result.
      };

    } // Fix the style of the element.

    this.menu.querySelector("#delete-filtered-menu-item").style.display = "none"
    this.menu.querySelector("#delete-all-data-menu-item").style.display = "none"


    this.style.display = "flex";
    this.style.flexDirection = "column"; // Create the body of table after the header...

    this.scrollDiv = createElement(this.insertBefore(document.createElement("div"), this.children[1]));
    this.scrollDiv.element.style.overflowY = "auto"; // Display scroll as needed.

    this.scrollDiv.element.style.overflowX = "hidden"; // Display scroll as needed.

    this.scrollDiv.element.scrollTop = 0; // if now row height are given i will take the header heigth as default.

    if (this.rowheight == -1) {
      this.rowheight = this.children[0].offsetHeight;
    } // If the header is fixed I will translate it to keep it 
    // at the required position.


    this.scrollDiv.element.addEventListener("scroll", function (table) {
      return function (e) {
        var header = table.children[0]; // If the header is fixe I will

        if (header.fixed) {
          if (this.scrollTop != 0) {
            header.style.boxShadow = "var(--dark-mode-shadow)";
          } else {
            header.style.boxShadow = "";
          }
        } // render the table.


        table.render();
      };
    }(this));
    this.refresh();
  }

  /**
   * Redraw all tile and values.
   */
  refresh() {
    // reset the index.
    this.index = -1; // remove acutal rows.

    if (this.scrollDiv != null) {
      this.scrollDiv.removeAllChilds(); // Recreate tiles
      this.createTiles(); // Redisplay values.
    }

    this.render();

  }

  clear() {
    this.data = []
    this.sorted = [];
    this.filtered = {};

    this.refresh();

  }
  //////////////////////////////////////////////////////////////////////////////////////
  // Data access function.
  //////////////////////////////////////////////////////////////////////////////////////

  /**
   * Return the table data.
   */
  getData() {
    if (this.data == undefined) {
      return [];
    }

    return this.data;
  }

  /**
   * Return only the filtered data.
   */
  getFilteredData() {
    if (Object.keys(this.filtered).length == 0) {
      if (this.getFilters().length > 0) {
        return [];
      }

      return this.data;
    } // if there are sorters, use this.sorted to store the values.


    if (this.getSorters().length > 0) {
      if (this.sorted == 0) {
        for (var i = 0; i < this.data.length; i++) {
          if (this.filtered[this.data[i].index] != undefined) {
            this.sorted.push(this.data[i]);
          }
        }
      } // return the list of sorted and filtered values.

      return this.sorted;
    } // Return the list of all filtered values.

    return Object.values(this.filtered);
  }

  /**
   * Return the data at the given position.
   * @param {*} row The table row
   * @param {*} column The table column.
   */
  getDataAt(row, column) {
    if (this.data == undefined) {
      return [];
    }

    return this.data[row][column];
  }

  /**
   * Return the data for a given index.
   * @param {} index 
   */
  getRowData(index) {
    if (this.getData() == undefined) {
      return [];
    }

    return this.data[index];
  }

  /**
   * Return all data in a given column
   * @param {*} index The column index.
   */
  getColumnData(index) {
    var data = [];

    if (this.getData() != undefined) {
      for (var i = 0; i < this.getData().length; i++) {
        data.push({
          "value": this.getData()[i][index],
          "index": this.getData()[i].index
        });
      }
    }

    return data;
  }

  getFilteredColumnData(index) {
    let filtered = this.getFilteredData()
    if (Object.keys(filtered).length == 0) {
      if (this.getFilters().length > 0) {
        return []; // all data are filtered.
      }

      return this.data;
    }

    var data = [];

    if (this.getData() != undefined) {
      for (var i in filtered) {
        data.push({
          // push the filtered values.
          "value": filtered[i][index],
          "index": filtered[i].index
        });
      }
    }

    return data;
  }

  /**
   * Return the visible data size.
   */
  size() {
    // if filters are applied.
    let filtered = this.getFilteredData()
    if (Object.keys(filtered).length > 0) {
      return Object.keys(filtered).length;
    } else if (this.hasFilter()) {
      return 0; // all filtered.
    }

    return this.getData().length;
  }
  /**
   * Return the list of sorter.
   */


  getSorters() {
    var sorters = new Array(); // reset data order.

    for (var i = 0; i < this.sorters.length; i++) {
      var sorter = this.sorters[i];
      sorter.childSorter = null;

      if (sorter.state != undefined) {
        if (sorter.state != 0) {
          sorters[sorter.order - 1] = sorter;
        }
      }
    }

    return sorters;
  }

  deleteRow(index) {
    this.data.splice(index, 1)
    let i = 0
    this.data.forEach(d => {
      d.index = i;
      i++
    })

    this.sort()
    this.filter()
    this.refresh()
  }

  /**
   * Order a table. 
   * @param {*} side can be asc, desc or nothing.
   */
  sort() {
    this.data.sort(function (a, b) {
      var indexA = parseInt(a.index);
      var indexB = parseInt(b.index);
      return indexA - indexB;
    }); // empty the sorted list.

    this.sorted = [];
    var sorters = this.getSorters(); // I will copy values of rows to keep the original order...
    // reset to default...

    if (sorters.length > 0) {
      // Link the sorter with each other...
      for (var i = 0; i < sorters.length - 1; i++) {
        sorters[i].childSorter = sorters[i + 1];
      } // Now I will call sort on the first sorter...


      if (sorters[0].state != 0) {
        sorters[0].sortValues(this.data);
      }
    }
  }


  /**
   * Return the list of active filters.
   */
  getFilters() {
    var filters = []; // put all filter in the save array.

    for (var i = 0; i < this.filters.length; i++) {
      if (this.filters[i].filter != null) {
        if (this.filters[i].filter.expressions.length > 0 || this.filters[i].filter.filters.length > 0) {
          filters.push(this.filters[i].filter);
        }
      }
    }

    return filters;
  }

  /**
   * Filter table values.
   */
  filter() {
    // so here I will empty the filtered map.
    this.filtered = {}; // Get the filters

    var filters = this.getFilters();

    function getData(table, indexs) {
      var filtered = {};

      for (var i = 0; i < indexs.length; i++) {
        filtered[indexs[i]] = table.getRowData(indexs[i]);
      }

      return filtered;
    } // filters are cumulative from column to columns.


    if (filters.length > 0) {
      this.filtered = getData(this, filters[0].evaluate());

      if (filters.length > 1) {
        for (var i = 1; i < filters.length; i++) {
          for (var i = 1; i < filters.length; i++) {
            var filtered = getData(this, filters[i].evaluate());
            var filtered_ = {};

            for (var id in filtered) {
              if (this.filtered[id] != undefined) {
                filtered_[id] = this.filtered[id];
              }
            }

            this.filtered = filtered_;
          }
        }
      } else {
        this.filtered = getData(this, filters[0].evaluate());
      }
    } // Now I will set the filter in the menu.

    let filterMenuItems = this.menu.querySelector("#filter-menu-items");

    if (filters.length > 0) {
  
      filterMenuItems.style.display = "block"
      filterMenuItems.innerHTML = "";

      for (var i = 0; i < filters.length; i++) {
        // So here I will create the menu item asscoiated with each filter and given.
        let filter = filters[i];

        if (filter.expressions.length > 0 || filter.filters.length > 0) {
          let text = filter.parent.headerCell.innerText
          let menuItem = new DropdownMenuItem("icons:close", text)
          menuItem.slot = "subitems"

          menuItem.action = () => {
            menuItem.parentNode.removeChild(menuItem);
            filter.clearFileterBtn.element.click();
            this.filter();
            this.refresh();
          }

          filterMenuItems.appendChild(menuItem)
        }
      }
    } else{
      filterMenuItems.style.display = "none"
    }// In that case I will call the onfilter event.


    for (var i = 0; i < this.filters.length; i++) {
      if (this.filters[i].filter != null) {
        if (this.filters[i].onfilter != undefined) {
          // Call the render function with div and value as parameter.
          var values = this.filters[i].filter.getFilterdValues();

          if (isString(this.filters[i].onfilter)) {
            eval(this.filters[i].onfilter + "(values)");
          } else {
            this.filters[i].onfilter(values);
          }
        }
      }
    }
  }

}

customElements.define('table-element', TableElement);