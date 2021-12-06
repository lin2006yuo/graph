let __friction = 0.89;
let __springFactor = 0.01;

class Ball {
	constructor(x, y, radius, color) {
		this.x = x || 0;
		this.y = y || 0;

        this.originalX = x || 0;
        this.originalY = y || 0;
        this.vx = 0;
        this.vy = 0;
		this.radius = radius || 2;
		this.color = color || "#ff6600";
	}
    setPos(x,y){
        this.x = x;
        this.y = y;
    }
    think(mouse){
        let dx = this.x - mouse.x;
        let dy = this.y - mouse.y;

        let  dist = Math.sqrt(dx*dx + dy*dy);
        // interaction
        if(dist<30){
            let angle = Math.atan2(dy,dx);
            let tx = mouse.x + Math.cos(angle) * 30;
            let ty = mouse.y + Math.sin(angle) * 30;

            console.log({ mx: mouse.x, tx, x: this.x })

            this.vx += tx - this.x;
            this.vy += ty - this.y;
        }

        // spring back
        let dx1 = -(this.x - this.originalX);
        let dy1 = -(this.y - this.originalY);

        this.vx += dx1 * __springFactor;
        this.vy += dy1 * __springFactor;

        
        // friction
        this.vx *= __friction;
        this.vy *= __friction;

        // actual move
        this.x += this.vx;
        this.y += this.vy;
    }

	draw(ctx) {
		ctx.save();
		ctx.beginPath();
		ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
		ctx.fillStyle = this.color;
		ctx.fill();
		ctx.closePath();
		ctx.restore();
	}
}
