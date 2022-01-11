"use strict";

var BodyStatic = 1;
var BodyDynamic = 2;
var ShapeCircle = 3;
var ShapeRectangle = 4;
var ShapeLine = 5;

function Vec(x, y) { // 引数x, yでベクトルオブジェクトを生成するコンストラクタ
    this.x = x; // this.xプロパティに引数xを設定
    this.y = y; // this.yプロパティに引数yを設定
}

// Vecオブジェクトのプロトタイプとして、以下のメソッドを定義
Vec.prototype.add = function (v) {      // ベクトルオブジェクトvを引数としてベクトル和を求めるメソッドを定義
    return new Vec(this.x + v.x, this.y + v.y); // 元の座標this(x, y)に引数ベクトルのx成分, y成分を加算してるだけ
}

Vec.prototype.mul = function (x, y) {   // ベクトルの掛算では x, y成分の両方に同数を掛けるが、汎用性を持たすためにx, y成分それぞれに引数を与える事ができるようにしている
    var y = y || x; // <= 引数が一つしか与えられなければx成分にもy成分にも同数を掛ける
    return new Vec(this.x * x, this.y * y);
}

Vec.prototype.dot = function (v) {      // 内積
    return this.x * v.x + this.y * v.y;
}

Vec.prototype.cross = function (v) {    // 外積
    return this.x * v.y - v.x * this.y;
}

Vec.prototype.move = function (dx, dy) {// 自分を移動
    this.x += dx;
    this.y += dy;
}

// 矩形オブジェクト を生成するコンストラクタを定義
function RectangleEntity(x, y, width, height) {
    this.shape = ShapeRectangle;
    this.type = BodyStatic; // 矩形オブジェクトは動かないエンティティとする(作り手の決めの問題)
    this.x = x;
    this.y = y;
    this.w = width;
    this.h = height;
    this.deceleration = 1.0;
    this.isHit = function (i, j) { // 衝突するメソッドを定義
        return (this.x <= i && i <= this.x + this.w &&
            this.y <= j && j <= this.y + this.h) // (i, j)が矩形の辺上もしくは内部にあるときにtrueを返す
    }
}

// 線オブジェクト を生成するコンストラクタを定義
function LineEntity(x0, y0, x1, y1, restitution) { // 引数は始点(x0, y0)と終点(x1, y1)と反発係数restutution
    this.shape = ShapeLine;
    this.type = BodyStatic; // 線オブジェクトは動かないエンティティとする(作り手の決めの問題)
    this.x = (x0 + x1) / 2; // プロパティ(x,y)は線分の中点
    this.y = (y0 + y1) / 2;
    this.x0 = x0;
    this.y0 = y0;
    this.x1 = x1;
    this.y1 = y1;

    this.restitution = restitution || 0.9; // 引数で与えられなかったら自動的に0.9を指定。
    this.vec = new Vec(x1 - x0, y1 - y0); // Vecコンストラクタを用いて、線分ベクトルをプロパティとして定義
    var length = Math.sqrt(Math.pow(this.vec.x, 2) + Math.pow(this.vec.y, 2)); // ふつうにピタゴラスの定理。Math.pow(x, n) => x^n
    this.norm = new Vec(y0 - y1, x1 - x0).mul(1 / length); // 法線方向のベクトルを正規化(長さを1に)したもの
}

// 円オブジェクト を生成するコンストラクタを定義
function CircleEntity(x, y, radius, type, restitution, deceleration) { // 引数に中心座標(x, y)、半径、移動するかどうかtype、反発係数、減速度合
    this.shape = ShapeCircle;
    this.type = type || BodyDynamic; // 引数で指定されなかったら自動的に動くオブジェクトとする
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.restitution = restitution || 0.9; // 引数で指定されなかったら自動的に0.9を指定。
    this.deceleration = deceleration || 1.0; // 引数で指定されなかったら自動的に1.0を指定。
    this.accel = new Vec(0, 0); // Vecコンストラクタを用いて加速度ベクトルをプロパティとして生成
    this.velocity = new Vec(0, 0); // Vecコンストラクタを用いて速度ベクトルをプロパティとして生成

    this.move = function (dx, dy) { // 中心座標を移動させるメソッドを定義
        this.x += dx; // 引数dx分だけx方向に進む
        this.y += dy; // 引数dy分だけy方向に進む
    }

    this.isHit = function (x, y) { // 円がとある座標引数(x, y)と衝突したかどうかを判定する(true || false で返す)メソッドを定義
        var d2 = Math.pow(x - this.x, 2) + Math.pow(y - this.y, 2); // 中心座標と(x, y)との距離の2乗
        return d2 < Math.pow(this.radius, 2); // 中心からの距離の2乗と半径の2乗の大きさを比較。(x, y)の方が近ければtrue
    }

    this.collidedWithRect = function (r) {  // 円(this)と矩形(r)の衝突メソッドを定義
        // 矩形の４辺上で最も円の中心に近い座標(nx, ny)を求める
        var nx = Math.max(r.x, Math.min(this.x, r.x + r.w)); // 数直線に書いて確認すれば分かる
        var ny = Math.max(r.y, Math.min(this.y, r.y + r.h)); // 数直線に書いて確認すれば分かる
        
        // 矩形の4辺上で最も円の中心に近い座標(nx, ny)と円が衝突したかどうかを判定する(さっき定義したメソッドを使う)
        if (!this.isHit(nx, ny)) {      // 衝突なし→リターンで衝突判定関数終了 ※"!変数"は論理否定の論理演算子。trueのときfalse, falseのときtureを返す
            return;
        } // そうでなければ、つまり、衝突が発生していれば次の処理に進む ↓

        if (this.onhit) { // onhitメソッドが(参照先で)定義されていれば、衝突した2つのオブジェクトを引数にしてonhitメソッド発火(コールバック関数)。
            this.onhit(this, r);
        }

        var d2 = Math.pow(nx - this.x, 2) + Math.pow(ny - this.y, 2); // 矩形上の一番近い座標と中心座標の距離の2乗
        var overlap = Math.abs(this.radius - Math.sqrt(d2)); // 重なっている(めりこんだ)距離を計算
        var mx = 0, my = 0;

        // 円の中心座標に最も近い矩形上の座標がどの辺に属するかを判定
        // ※このエンジンでは矩形は座標系に対して水平垂直な辺しか持たないのでこの判定が可能
        if (ny == r.y) {		        // 上辺衝突 <= この座標系は左上を原点としてy軸が鉛直方向下向きに伸びている点に注意
            my = -overlap;
        } else if (ny == r.y + r.h) {	// 下辺衝突 <= この座標系は左上を原点としてy軸が鉛直方向下向きに伸びている点に注意
            my = overlap; 
        } else if (nx == r.x) {         // 左辺衝突
            mx = -overlap;
        } else if (nx == r.x + r.w) {   // 右辺衝突
            mx = overlap;
        } else {    // 矩形の中 <= あとで理解する
            mx = -this.velocity.x;
            my = -this.velocity.y;
        }

        this.move(mx, my); // 移動メソッドでめり込んだ分だけ座標を戻して一旦接している状態にする
        if (mx) {   // mxを保持しているならば(つまり衝突しているならば)  ※if(変数)のとき、変数=0, "", undifined, null ならば falseを返す
            this.velocity = this.velocity.mul(-1 * this.restitution, 1); // 掛け算メソッドで速度ベクトル(x成分)を逆向き & 反発係数倍に
        }
        if (my) {   // myを保持しているならば
            this.velocity = this.velocity.mul(1, -1 * this.restitution); // 掛け算メソッドで速度ベクトル(y成分)を逆向き & 反発係数倍に
        }
    }

    this.collidedWithLine = function (line) {  // 円と線の衝突メソッドを定義 ※ここは複雑なのであとで理解
        var v0 = new Vec(line.x0 - this.x + this.velocity.x, line.y0 - this.y + this.velocity.y); // 
        var v1 = this.velocity; // 円オブジェクトの速度プロパティを変数に格納
        var v2 = new Vec(line.x1 - line.x0, line.y1 - line.y0); // 引数で与えられた線オブジェクトのベクトルオブジェクトを生成。始点(x0, y0)=>(x1, y1)
        var cv1v2 = v1.cross(v2);
        var t1 = v0.cross(v1) / cv1v2;
        var t2 = v0.cross(v2) / cv1v2;
        var crossed = (0 <= t1 && t1 <= 1) && (0 <= t2 && t2 <= 1); // この条件式がtrueならば次のif文で衝突反射の処理を行う

        if (crossed) {
            this.move(-this.velocity.x, -this.velocity.y);
            var dot0 = this.velocity.dot(line.norm);   // 法線と速度の内積
            var vec0 = line.norm.mul(-2 * dot0);
            this.velocity = vec0.add(this.velocity);
            this.velocity = this.velocity.mul(line.restitution * this.restitution);
            if (this.onhit) { // オブジェクトthisにonhitメソッドが(参照先で)定義されていれば
                this.onhit(this, line); // 衝突した2つのオブジェクトを引数にしてonhitメソッドを発火
            }  
        }
    }

    this.collidedWithCircle = function (peer) {  // 円と円の衝突メソッドを定義
        var d2 = Math.pow(peer.x - this.x, 2) + Math.pow(peer.y - this.y, 2); // 2円の中心座標の距離の2乗
        if (d2 >= Math.pow(this.radius + peer.radius, 2)) { //それが互いの半径の和の2乗よりも大きければ
            return; // 衝突は発生していないのでreturnで関数強制終了。そうでなければ衝突発生しているので以下に続く↓
        }

        if (this.onhit) { // オブジェクトthisにonhitメソッドが(参照先で)定義されていれば
            this.onhit(this, peer); // 衝突した2つのオブジェクトを引数にしてonhitメソッドを発火
        }
        if (peer.onhit) { // オブジェクトpeerにonhitメソッドが(参照先で)定義されていれば
            peer.onhit(peer, this); // 衝突した2つのオブジェクトを引数にしてonhitメソッドを発火
        }

        var distance = Math.sqrt(d2) || 0.01; // 2円の中心間の距離を変数に格納。|| の部分はエラー回避処理？
        var overlap = this.radius + peer.radius - distance; // 重なっている(めり込んだ)距離計算

        var v = new Vec(this.x - peer.x, this.y - peer.y); // 2円の中心間をつなぐベクトル(=法線ベクトル)を生成
        var aNormUnit = v.mul(1 / distance);        // 法線単位ベクトル１を定義
        var bNormUnit = aNormUnit.mul(-1);          // 法線単位ベクトル２を定義

        
        if (this.type == BodyDynamic && peer.type == BodyStatic) { // thisが動的、peerが静的オブジェクトだった場合、
            this.move(aNormUnit.x * overlap, aNormUnit.y * overlap); // まず法線単位ベクトル1方向にoverlap分だけ座標移動
            var dot0 = this.velocity.dot(aNormUnit);   // 法線と速度の内積
            var vec0 = aNormUnit.mul(-2 * dot0); // 衝突反射で得られた速度ベクトル成分 ※ベクトル図解すれば2倍する意味分かる
            this.velocity = vec0.add(this.velocity); // を、もともとの速度ベクトルと合成
            this.velocity = this.velocity.mul(this.restitution); // 合成後の速度ベクトルに対して反発係数を掛ける <= なぜここで？
        }
        else if (peer.type == BodyDynamic && this.type == BodyStatic) { // peerが動的、thisが静的オブジェクトだった場合、
            peer.move(bNormUnit.x * overlap, bNormUnit.y * overlap); // まず法線単位ベクトル2方向にoverlap分だけ座標移動
            var dot1 = peer.velocity.dot(bNormUnit);   // 法線と速度の内積
            var vec1 = bNormUnit.mul(-2 * dot1); // 衝突反射で得られた速度ベクトル成分 ※ベクトル図解すれば2倍する意味分かる
            peer.velocity = vec1.add(peer.velocity); // を、もともとの速度ベクトルと合成
            peer.velocity = peer.velocity.mul(peer.restitution); // 合成後の速度ベクトルに対して反発係数を掛ける <= なぜここで？
        }
        else { // 2円とも動的オブジェクトだった場合、
            this.move(aNormUnit.x * overlap / 2, aNormUnit.y * overlap / 2); // まず法線ベクトル1方向にoverlapの半分だけ座標移動
            peer.move(bNormUnit.x * overlap / 2, bNormUnit.y * overlap / 2); // まず法線ベクトル2方向にoverlapの半分だけ座標移動

            var aTangUnit = new Vec(aNormUnit.y * -1, aNormUnit.x); // 接線ベクトル１
            var bTangUnit = new Vec(bNormUnit.y * -1, bNormUnit.x); // 接線ベクトル２

            var aNorm = aNormUnit.mul(aNormUnit.dot(this.velocity)); // aベクトル法線成分
            var aTang = aTangUnit.mul(aTangUnit.dot(this.velocity)); // aベクトル接線成分
            var bNorm = bNormUnit.mul(bNormUnit.dot(peer.velocity)); // bベクトル法線成分
            var bTang = bTangUnit.mul(bTangUnit.dot(peer.velocity)); // bベクトル接線成分

            this.velocity = new Vec(bNorm.x + aTang.x, bNorm.y + aTang.y); // 反射後の法線成分ベクトルと接戦成分ベクトルを合成して反射後の速度ベクトルを生成
            peer.velocity = new Vec(aNorm.x + bTang.x, aNorm.y + bTang.y); // 反射後の法線成分ベクトルと接戦成分ベクトルを合成して反射後の速度ベクトルを生成
        }
    }
}

// 物理エンジン を生成するコンストラクタを定義
function Engine(x, y, width, height, gravityX, gravityY) { // 物理世界の左上座標(x,y)、そのサイズ(width, height)、重力加速度
    this.worldX = x || 0; // 引数が指定されていなかったら自動的に0
    this.worldY = y || 0; // 引数が指定されていなかったら自動的に0
    this.worldW = width || 1000; // 引数が指定されていなかったら自動的に1000
    this.worldH = height || 1000; // 引数が指定されていなかったら自動的に1000
    this.gravity = new Vec(gravityX, gravityY); // 重力場もベクトルオブジェクトで定義
    this.entities = []; // 物理エンジンの世界のオブジェクト(entity)を保持する配列。ちなみに中身の生成はこのスクリプト内では行わないっぽい。

    this.setGravity = function (x, y) { // 物理世界を生成したあと、ゲームの途中で重力場を変更したいときに使うメソッド
        this.gravity.x = x;
        this.gravity.y = y;
    }

    this.step = function (elapsed) { // 経過時間elapsed を引数にした、物理世界の時計を進めるメソッド
        var gravity = this.gravity.mul(elapsed, elapsed); // 重力に経過時間を掛けてその時間分の速度ベクトルを変数gravityに格納
        var entities = this.entities; // オブジェクト(entity)配列を変数entitiesに格納

        // entityを移動
        entities.forEach(function (e) { // forEachメソッド(Arrayオブジェクトのデフォルトメソッド)は、配列内のすべての要素に与えられた関数を1度ずつ実行
            if (e.type == BodyDynamic) { // 動くオブジェクトならば
                var accel = e.accel.mul(elapsed, elapsed); // 対象となるentityの加速度に対して経過時間を掛けて加速度由来の速度ベクトルを変数accelに格納
                e.velocity = e.velocity.add(gravity); // 対象となるentityの速度ベクトルに重力由来の速度ベクトルを合成
                e.velocity = e.velocity.add(accel); // 対象となるentityの速度ベクトルに加速度由来の速度ベクトルを合成
                e.velocity = e.velocity.mul(e.deceleration); // 対象となるentityの速度ベクトルに減速度合由来の速度ベクトルを合成
                e.move(e.velocity.x, e.velocity.y); // 対象となるentityの座標ベクトルを速度ベクトル(※厳密には経過時間elapsedをさらに掛けるべきだが、作成者が敢えて無視)に従って移動。
            }
        });

        // 範囲外のオブジェクトを削除
        this.entities = entities.filter(function (e) { // Array.filterメソッド(配列オブジェクトのデフォルトメソッド)
            return this.worldX <= e.x && e.x <= this.worldX + this.worldW &&
                this.worldY <= e.y && e.y <= this.worldY + this.worldH; // このテスト関数function(e)でtrue通過した要素のみを残して新しい配列を生成
        }, this);

        // 衝突判定 & 衝突処理
        for (var i = 0 ; i < entities.length - 1 ; i++) {
            for (var j = i + 1; j < entities.length ; j++) { // 自分と自分の衝突判定や重複判定を避けるようにループのインデックスを工夫。対戦表を書いてみると分かる。
                var e0 = entities[i], e1 = entities[j];
                if (e0.type == BodyStatic && e1.type == BodyStatic) { // どちらも静的エンティティならば衝突判定不要。スルー。
                    continue;
                }

                if (e0.shape == ShapeCircle && e1.shape == ShapeCircle) { // エンティティ種類の組合せに応じて、定義済みの衝突関数を発火
                    e0.collidedWithCircle(e1);
                } else if (e0.shape == ShapeCircle && e1.shape == ShapeLine) {
                    e0.collidedWithLine(e1);
                } else if (e0.shape == ShapeLine && e1.shape == ShapeCircle) {
                    e1.collidedWithLine(e0);
                } else if (e0.shape == ShapeCircle && e1.shape == ShapeRectangle) {
                    e0.collidedWithRect(e1);
                } else if (e0.shape == ShapeRectangle && e1.shape == ShapeCircle) {
                    e1.collidedWithRect(e0);
                }
            }
        }
    }
}
