const DOWN_MAXIMUM_TOTAL = 10;
const DOWN_MAXIMUM_PER_HOSTNAME = 3;

const urls = [
    'http://domain-1.some/1',
    'http://domain-1.some/2',
    'http://domain-1.some/3',
    'http://domain-1.some/4',
    'http://domain-1.some/5',
    'http://domain-2.some/1',
    'http://domain-2.some/2',
    'http://domain-2.some/3',
    'http://domain-2.some/4',
    'http://domain-2.some/5',
    'http://domain-3.some/1',
    'http://domain-4.some/1',
    'http://domain-5.some/1',
    'http://domain-6.some/1',
    'http://domain-7.some/1',
    'http://domain-8.some/1',
    'http://domain-9.some/1',
    'http://domain-10.some/1',
];

const downloader = {
    limits: {
        total: 0,
        hostnames: {},
    },
    iterator: undefined,
    generator: function *(urls) {
        while (urls.length) {
            // TBD: в продуктовом решении возможно надо заменить reduce на самописный вариант
            // определяется количеством записей в urls (если много - reduce большую часть unservedUrls
            // гоняет впустую)
            // TBD: теоретически, при вызове из резолвера download появится только один свободный слот,
            // и тут (снова) reduce не лучший вариант
            urls = urls.reduce((unservedUrls, url) => {
                if (DOWN_MAXIMUM_TOTAL <= this.limits.total) {
                    unservedUrls.push(url);
                    return unservedUrls;
                }
    
                let hostname = (new URL(url)).hostname;
                if (!this.limits.hostnames[hostname]) {
                    this.limits.hostnames[hostname] = 0;
                }
                else if (DOWN_MAXIMUM_PER_HOSTNAME <= this.limits.hostnames[hostname]) {
                    unservedUrls.push(url);
                    return unservedUrls;
                }
    
                this.download(url);
                return unservedUrls;
            }, []);
            yield;
        }
    },
    start: function (urls) {
        this.iterator = this.generator(urls);
        this.iterator.next();
    },
    download: function (url) {
        console.log(`download: START: ${url}`);
        let hostname = (new URL(url)).hostname;
        this.limits.hostnames[hostname]++;
        this.limits.total++;
        return new Promise(resolve=>{
            wait(rand(4000, 10000)).then(value=>{
                console.log(`download: DONE: ${url}`);
                this.limits.hostnames[(new URL(url)).hostname]--;
                this.limits.total--;
                this.iterator.next();
                resolve(url);
            })
        });
    }
}

function wait(ms) {
    return new Promise(resolve=>setTimeout(resolve, ms));
}

function rand(min, max) {
    return min + Math.round(Math.random()*(max - min));
}

downloader.start(urls);
