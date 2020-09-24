/*
Идея такая:
- есть фильтр;
- в фильтр можно добавить URL или запросить следующий URL;
- фильтры могут объединяться в цепочки;
- при добавлении URL в фильтр он либо пропускает его дальше по цепочке, либо сохраняет во внутреннем хранилище 
  (если условия пропуска не выполнены, например - превышено количество обрабатываемых url для домена);
- после завершения скачивания файла происходит запрос к первому фильру цепочки на получение следующего url;
- этот запрос проходит по всей цепочке и выдергивает url из первого подходящего внутреннего хранилища, передавая его дальше;

В итоге, в нашем случае цепочка выглядит так:
<один проход по всем url, где мы "засыпаем" urls в цепочку фильров> => [фильтр на максимальное количество скачиваний по hostname] -> 
[фильтр на максимально количество одновременных скачиваний] -> [метод скачивания] -> ... (ожидание скачивания) ... -> 
<запрос на следующий url к первому фильтру>.
*/
const urls = [
  "http://domain-1.some/1",
  "http://domain-1.some/2",
  "http://domain-1.some/3",
  "http://domain-1.some/4",
  "http://domain-1.some/5",
  "http://domain-2.some/1",
  "http://domain-2.some/2",
  "http://domain-2.some/3",
  "http://domain-2.some/4",
  "http://domain-2.some/5",
  "http://domain-3.some/1",
  "http://domain-4.some/1",
  "http://domain-5.some/1",
  "http://domain-6.some/1",
  "http://domain-7.some/1",
  "http://domain-8.some/1",
  "http://domain-9.some/1",
  "http://domain-10.some/1",
];

class Filter {
  constructor(nextChain) {
    this.nextChain = nextChain;
  }

  setChain(chain) {
    this.nextChain = chain;
    return this.nextChain;
  }

  addUrl(url) {}

  nextUrl(url) {}

  getNextUrl() {}
}

class FilterByHostname extends Filter {
  MAX_HOSTNAME_CNT = 2;

  constructor(nextChain) {
    super(nextChain);
    this.hostnames = {};
  }

  addUrl(url) {
    // console.log(`FBH.addUrl: ${url}`);
    if (!url) return;

    let hostname = new URL(url).hostname;

    if (!this.hostnames[hostname]) {
      this.hostnames[hostname] = {
        urls: [],
        cnt: 0,
      };
    }

    this.hostnames[hostname].urls.push(url);

    this.nextChain.addUrl(this.getNextUrl(hostname));
  }

  nextUrl(url) {
    // console.log(`FBH.nextUrl: ${url}`);
    let hostname = new URL(url).hostname;

    this.hostnames[hostname].cnt--;

    this.nextChain.nextUrl(this.getNextUrl(hostname));
  }

  getNextUrl(hostname) {
    if (this.MAX_HOSTNAME_CNT > this.hostnames[hostname].cnt) {
      this.hostnames[hostname].cnt++;
      return this.hostnames[hostname].urls.shift();
    }
  }
}

class FilterByTotal extends Filter {
  MAX_TOTAL_CNT = 5;

  constructor(nextChain) {
    super(nextChain);
    this.cnt = 0;
    this.urls = [];
  }

  addUrl(url) {
    // console.log(`FBT.addUrl: ${url}`);
    if (!url) return;

    this.urls.push(url);

    this.nextChain.addUrl(this.getNextUrl());
  }

  nextUrl(url) {
    // console.log(`FBT.nextUrl: ${url}`);

    this.cnt--;

    if (url) {
      this.urls.push(url);
    }

    this.nextChain.nextUrl(this.getNextUrl());
  }

  getNextUrl(hostname) {
    if (this.MAX_TOTAL_CNT > this.cnt) {
      this.cnt++;
      return this.urls.shift();
    }
  }
}

class Downloader {
  constructor(filter) {
    this.filter = filter;
  }

  addUrl(url) {
    // console.log(`DWN.addUrl: ${url}`);
    this.downUrl(url);
  }

  nextUrl(url) {
    // console.log(`DWN.nextUrl: ${url}`);
    this.downUrl(url);
  }

  downUrl(url) {
    if (!url) return;

    console.log(`download START: ${url} ${new Date().toISOString()}`);
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`download DONE:  ${url}  ${new Date().toISOString()}`);

        this.filter.nextUrl(url);
        resolve();
      }, this.random(4000, 10000));
    });
  }

  random(min, max) {
    return Math.round(min + Math.random() * (max - min));
  }
}

let rootFilter = new FilterByHostname();
rootFilter.setChain(new FilterByTotal()).setChain(new Downloader(rootFilter));

for (let url of urls) {
  rootFilter.addUrl(url);
}
