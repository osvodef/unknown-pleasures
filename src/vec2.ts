export class Vec2 {
    public x: number;
    public y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    add(vec: Vec2): Vec2 {
        return new Vec2(this.x + vec.x, this.y + vec.y);
    }

    sub(vec: Vec2): Vec2 {
        return new Vec2(this.x - vec.x, this.y - vec.y);
    }

    mul(scalar: number): Vec2 {
        return new Vec2(this.x * scalar, this.y * scalar);
    }

    perp(): Vec2 {
        return new Vec2(this.y, -this.x);
    }

    normalize(): Vec2 {
        const length = this.length();

        if (length === 0) {
            return new Vec2(0, 0);
        }

        return new Vec2(this.x / length, this.y / length);
    }

    length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
}
