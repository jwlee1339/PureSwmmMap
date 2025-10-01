// LitUserTable.js
// 2023-12-03
// 測試用

import { LitElement, html, css } from 'https://cdn.jsdelivr.net/gh/lit/dist@3/core/lit-core.min.js';


// Modern method: Only work with chromium based browser and safari.
// 載入外部css檔案
import styles from '../css/bootstrap5.css' assert { type: 'css' };

export class UserTable extends LitElement {
    // Define scoped styles right with your component, in plain CSS
    // 使用外部定義的CSS
    static styles = [styles];

    constructor() {
        super();
        this.fetchData();
    }

    data = [
        { name: '張三', age: 25, gender: '男', phone: '0912345678' }
    ];

    addRow(index) {
        this.data.splice(index + 1, 0, { name: '', age: '', gender: '', phone: '' });
        this.requestUpdate();
    }

    deleteRow(index) {
        if (this.data.length > 1) {
            this.data.splice(index, 1);
            this.requestUpdate();
        }
    }

    updateCell(event, index, key) {
        // this.data[index][key] = event.target.textContent;
        // this.requestUpdate();
    }

    fetchData() {

        fetch('https://randomuser.me/api/')
            .then(response => {
                return response.json();
            })
            .then(data => {
                let user = data.results[0];
                let name = user.name.first + ' ' + user.name.last;
                let age = user.dob.age;
                let gender = user.gender;
                let phone = user.phone;
                this.data.push({ name, age, gender, phone });
                this.requestUpdate();
            })
            .catch(error => console.error(error));
    }


    render() {
        return html`
      <div class="card shadow"  style="cursor: default; width:360px;  resize: both;">
        <div class="card-header text-white bg-primary p-1">
            <div class="fs-6">動態產生網頁表格</div>
        </div>
        <div class="card-body p-1">
            <div class="table-responsive">
            <table class="table align-middle table-bordered table-hover table-striped table-sm">
              <tr class="text-center">
                <th>姓名</th>
                <th>年齡</th>
                <th>性別</th>
                <th>電話</th>
                <th width=100 class="text-center">操作</th>
              </tr>
              ${this.data.map((row, index) => html`
                <tr class="text-center">
                  ${Object.keys(row).map(key => html`
                    <td>${row[key]}</td>
                  `)}
                  <td >
                    <button @click=${() => this.deleteRow(index)} class="btn btn-danger btn-sm">刪除</button>
                  </td>
                </tr>
              `)}
            </table>
            </div>
            <button @click=${this.fetchData} type="button" class="btn btn-primary btn-sm">更新</button>
        </div>
      </div>
      `;
    }
}

customElements.define('user-table', UserTable);



